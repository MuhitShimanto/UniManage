import axios from 'axios';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError';

function ensureBkashConfig() {
  if (!env.BKASH_APP_KEY || !env.BKASH_APP_SECRET || !env.BKASH_USERNAME || !env.BKASH_PASSWORD) {
    throw new AppError('bKash sandbox/live credentials are not configured in .env.', 503);
  }
}

export async function getBkashToken(): Promise<string> {
  ensureBkashConfig();
  const { data } = await axios.post(
    `${env.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
    {
      app_key: env.BKASH_APP_KEY,
      app_secret: env.BKASH_APP_SECRET,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        username: env.BKASH_USERNAME,
        password: env.BKASH_PASSWORD,
      },
    }
  );

  if (!data?.id_token) {
    throw new AppError(data?.statusMessage || 'Failed to obtain bKash auth token.', 502);
  }
  return data.id_token as string;
}

export async function createBkashPayment(params: {
  amount: number;
  transactionId: string;
  payerReference: string;
}) {
  const idToken = await getBkashToken();
  const { data } = await axios.post(
    `${env.BKASH_BASE_URL}/tokenized/checkout/create`,
    {
      mode: '0011',
      payerReference: params.payerReference,
      callbackURL: env.BKASH_CALLBACK_URL,
      amount: params.amount.toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: params.transactionId,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: idToken,
        'X-APP-Key': env.BKASH_APP_KEY,
      },
    }
  );

  if (!data?.bkashURL || !data?.paymentID) {
    throw new AppError(data?.statusMessage || 'Failed to create bKash payment session.', 502);
  }

  return {
    paymentID: data.paymentID as string,
    gatewayUrl: data.bkashURL as string,
    raw: data,
  };
}

export async function executeBkashPayment(paymentID: string) {
  const idToken = await getBkashToken();
  const { data } = await axios.post(
    `${env.BKASH_BASE_URL}/tokenized/checkout/execute`,
    { paymentID },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: idToken,
        'X-APP-Key': env.BKASH_APP_KEY,
      },
    }
  );
  return data as Record<string, unknown>;
}

export async function queryBkashPayment(paymentID: string) {
  const idToken = await getBkashToken();
  const { data } = await axios.post(
    `${env.BKASH_BASE_URL}/tokenized/checkout/payment/status`,
    { paymentID },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: idToken,
        'X-APP-Key': env.BKASH_APP_KEY,
      },
    }
  );
  return data as Record<string, unknown>;
}
