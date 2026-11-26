import { PaymentProvider } from '@prisma/client';
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    semesterId: z.string().min(1),
    title: z.string().min(3).max(150),
    amount: z.number().positive(),
    currency: z.string().default('BDT'),
    dueDate: z.coerce.date(),
  }),
});

export const initiatePaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string().min(1),
    provider: z.nativeEnum(PaymentProvider),
  }),
});
