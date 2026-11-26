import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as paymentsController from './payments.controller';
import { createInvoiceSchema, initiatePaymentSchema } from './payments.validation';

const router = Router();

// Gateway callbacks (publicly reachable by bKash / SSLCommerz servers)
router.get('/bkash/callback', paymentsController.bkashCallback);
router.post('/sslcommerz/success', paymentsController.sslCommerzSuccess);
router.post('/sslcommerz/fail', paymentsController.sslCommerzFail);
router.post('/sslcommerz/cancel', paymentsController.sslCommerzCancel);
router.post('/sslcommerz/ipn', paymentsController.sslCommerzIpn);

// Authenticated endpoints
router.use(authenticate);

router.post(
  '/invoices',
  authorize(Role.ADMIN),
  validate(createInvoiceSchema),
  paymentsController.createInvoice
);
router.get('/invoices/my', authorize(Role.STUDENT), paymentsController.getMyInvoices);

router.post(
  '/initiate',
  authorize(Role.STUDENT),
  validate(initiatePaymentSchema),
  paymentsController.initiate
);
router.get('/my', authorize(Role.STUDENT), paymentsController.getMyPayments);
router.get('/:transactionId', paymentsController.getByTransactionId);

export default router;
