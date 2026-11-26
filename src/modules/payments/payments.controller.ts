import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as paymentsService from './payments.service';

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await paymentsService.createFeeInvoice(req.body, req.user!.userId);
  return sendSuccess(res, 'Fee invoice created successfully', invoice, 201);
});

export const getMyInvoices = asyncHandler(async (req: Request, res: Response) => {
  const invoices = await paymentsService.getMyInvoices(req.user!.userId);
  return sendSuccess(res, 'Invoices retrieved successfully', invoices);
});

export const initiate = asyncHandler(async (req: Request, res: Response) => {
  const session = await paymentsService.initiatePayment(req.user!.userId, req.body);
  return sendSuccess(res, 'Payment session initiated successfully', session, 201);
});

export const sslCommerzSuccess = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentsService.handleSslCommerzCallback('success', req.body);
  return sendSuccess(res, 'SSLCommerz payment verified successfully', payment);
});

export const sslCommerzFail = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentsService.handleSslCommerzCallback('fail', req.body);
  return sendSuccess(res, 'SSLCommerz payment failure recorded', payment);
});

export const sslCommerzCancel = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentsService.handleSslCommerzCallback('cancel', req.body);
  return sendSuccess(res, 'SSLCommerz payment cancellation recorded', payment);
});

export const sslCommerzIpn = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentsService.handleSslCommerzCallback('ipn', req.body);
  return sendSuccess(res, 'SSLCommerz IPN processed', payment);
});

export const getByTransactionId = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentsService.getPaymentByTransactionId(
    String(req.params.transactionId)
  );
  return sendSuccess(res, 'Payment retrieved successfully', payment);
});

export const getMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await paymentsService.getMyPayments(req.user!.userId);
  return sendSuccess(res, 'Payment history retrieved successfully', payments);
});
