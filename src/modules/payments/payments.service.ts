import { PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { recordAuditLog } from '../../utils/auditLog';
import { createBkashPayment, executeBkashPayment } from './bkash.gateway';
import { initSslCommerzPayment, validateSslCommerzPayment } from './sslcommerz.gateway';

export async function createFeeInvoice(
  data: {
    studentId: string;
    semesterId: string;
    title: string;
    amount: number;
    currency: string;
    dueDate: Date;
  },
  actorId: string
) {
  const [student, semester] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { id: data.studentId } }),
    prisma.semester.findFirst({ where: { id: data.semesterId, deletedAt: null } }),
  ]);
  if (!student) throw new AppError('Student profile not found.', 404);
  if (!semester) throw new AppError('Semester not found.', 404);

  const invoice = await prisma.feeInvoice.create({ data });
  await recordAuditLog({
    actorId,
    action: 'INVOICE_CREATED',
    entityType: 'FeeInvoice',
    entityId: invoice.id,
  });
  return invoice;
}

export async function getMyInvoices(userId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) throw new AppError('Student profile not found.', 404);

  return prisma.feeInvoice.findMany({
    where: { studentId: student.id, deletedAt: null },
    include: {
      semester: { select: { id: true, name: true } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function initiatePayment(
  userId: string,
  input: { invoiceId: string; provider: PaymentProvider }
) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
  if (!student) throw new AppError('Student profile not found.', 404);

  const invoice = await prisma.feeInvoice.findFirst({
    where: { id: input.invoiceId, studentId: student.id, deletedAt: null },
  });
  if (!invoice) throw new AppError('Fee invoice not found.', 404);
  if (invoice.status === PaymentStatus.PAID) {
    throw new AppError('This invoice has already been paid.', 400);
  }

  const transactionId = `UMS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  let gatewayUrl = '';
  let gatewayPaymentId: string | undefined;
  let gatewayRaw: unknown;

  if (input.provider === PaymentProvider.BKASH) {
    const bkash = await createBkashPayment({
      amount: invoice.amount,
      transactionId,
      payerReference: student.studentCode,
    });
    gatewayUrl = bkash.gatewayUrl;
    gatewayPaymentId = bkash.paymentID;
    gatewayRaw = bkash.raw;
  } else {
    const ssl = await initSslCommerzPayment({
      amount: invoice.amount,
      currency: invoice.currency,
      transactionId,
      productName: invoice.title,
      customerName: student.user.name,
      customerEmail: student.user.email,
      customerPhone: student.user.phone || '01700000000',
    });
    gatewayUrl = ssl.gatewayUrl;
    gatewayPaymentId = ssl.sessionKey;
    gatewayRaw = ssl.raw;
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      studentId: student.id,
      provider: input.provider,
      amount: invoice.amount,
      currency: invoice.currency,
      transactionId,
      gatewayPaymentId,
      status: PaymentStatus.PENDING,
      gatewayResponse: gatewayRaw as Prisma.InputJsonValue,
    },
  });

  return {
    paymentId: payment.id,
    transactionId: payment.transactionId,
    provider: payment.provider,
    amount: payment.amount,
    gatewayUrl,
  };
}

async function markPaymentPaid(
  paymentId: string,
  gatewayResponse: Record<string, unknown>
) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new AppError('Payment record not found.', 404);
    if (payment.status === PaymentStatus.PAID) return payment;

    const now = new Date();
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: now,
        gatewayResponse: gatewayResponse as Prisma.InputJsonValue,
      },
    });

    await tx.feeInvoice.update({
      where: { id: payment.invoiceId },
      data: { status: PaymentStatus.PAID, paidAt: now },
    });

    return updatedPayment;
  });
}

export async function handleBkashCallback(query: { paymentID?: string; status?: string }) {
  if (!query.paymentID) {
    throw new AppError('Missing paymentID in bKash callback.', 400);
  }

  const payment = await prisma.payment.findFirst({
    where: { gatewayPaymentId: query.paymentID, provider: PaymentProvider.BKASH },
  });
  if (!payment) throw new AppError('bKash payment record not found.', 404);

  if (query.status === 'cancel' || query.status === 'failure') {
    const newStatus =
      query.status === 'cancel' ? PaymentStatus.CANCELLED : PaymentStatus.FAILED;
    return prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus },
    });
  }

  const executed = await executeBkashPayment(query.paymentID);
  if (executed.statusCode !== '0000' && executed.transactionStatus !== 'Completed') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        gatewayResponse: executed as Prisma.InputJsonValue,
      },
    });
    throw new AppError(
      (executed.statusMessage as string) || 'bKash payment execution failed.',
      400
    );
  }

  const updated = await markPaymentPaid(payment.id, executed);
  await recordAuditLog({
    action: 'PAYMENT_PAID_BKASH',
    entityType: 'Payment',
    entityId: updated.id,
    metadata: { transactionId: updated.transactionId },
  });
  return updated;
}

export async function handleSslCommerzCallback(
  outcome: 'success' | 'fail' | 'cancel' | 'ipn',
  body: Record<string, string>
) {
  const tranId = body.tran_id;
  if (!tranId) throw new AppError('Missing tran_id in SSLCommerz callback.', 400);

  const payment = await prisma.payment.findUnique({ where: { transactionId: tranId } });
  if (!payment) throw new AppError('Payment record not found.', 404);

  if (outcome === 'fail' || outcome === 'cancel') {
    const status = outcome === 'cancel' ? PaymentStatus.CANCELLED : PaymentStatus.FAILED;
    return prisma.payment.update({
      where: { id: payment.id },
      data: { status, gatewayResponse: body as Prisma.InputJsonValue },
    });
  }

  const valId = body.val_id;
  if (!valId) throw new AppError('Missing val_id for SSLCommerz verification.', 400);

  const validated = await validateSslCommerzPayment(valId);
  const validStatuses = ['VALID', 'VALIDATED'];
  if (!validStatuses.includes(String(validated.status))) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        gatewayResponse: validated as Prisma.InputJsonValue,
      },
    });
    throw new AppError('SSLCommerz payment validation failed.', 400);
  }

  const updated = await markPaymentPaid(payment.id, validated);
  await recordAuditLog({
    action: 'PAYMENT_PAID_SSLCOMMERZ',
    entityType: 'Payment',
    entityId: updated.id,
    metadata: { transactionId: updated.transactionId },
  });
  return updated;
}

export async function getPaymentByTransactionId(transactionId: string) {
  const payment = await prisma.payment.findUnique({
    where: { transactionId },
    include: {
      invoice: { select: { id: true, title: true, status: true } },
    },
  });
  if (!payment) throw new AppError('Payment not found.', 404);
  return payment;
}

export async function getMyPayments(userId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) throw new AppError('Student profile not found.', 404);

  return prisma.payment.findMany({
    where: { studentId: student.id },
    include: { invoice: { select: { title: true, semesterId: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
