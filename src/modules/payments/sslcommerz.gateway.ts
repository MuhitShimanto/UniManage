import axios from 'axios';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError';

function getSslCommerzBaseUrl() {
  return env.SSLCOMMERZ_IS_LIVE
    ? 'https://securepay.sslcommerz.com'
    : 'https://sandbox.sslcommerz.com';
}

function ensureSslCommerzConfig() {
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) {
    throw new AppError('SSLCommerz credentials are not configured in .env.', 503);
  }
}

export async function initSslCommerzPayment(params: {
  amount: number;
  currency: string;
  transactionId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}) {
  ensureSslCommerzConfig();

  const form = new URLSearchParams({
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: params.amount.toFixed(2),
    currency: params.currency,
    tran_id: params.transactionId,
    success_url: env.SSLCOMMERZ_SUCCESS_URL,
    fail_url: env.SSLCOMMERZ_FAIL_URL,
    cancel_url: env.SSLCOMMERZ_CANCEL_URL,
    ipn_url: env.SSLCOMMERZ_IPN_URL,
    shipping_method: 'NO',
    product_name: params.productName,
    product_category: 'Education',
    product_profile: 'non-physical-goods',
    cus_name: params.customerName,
    cus_email: params.customerEmail,
    cus_add1: 'University Campus',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: params.customerPhone || '01700000000',
  });

  const { data } = await axios.post(
    `${getSslCommerzBaseUrl()}/gwprocess/v4/api.php`,
    form.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  if (data?.status !== 'SUCCESS' || !data?.GatewayPageURL) {
    throw new AppError(data?.failedreason || 'Failed to initiate SSLCommerz session.', 502);
  }

  return {
    sessionKey: data.sessionkey as string,
    gatewayUrl: data.GatewayPageURL as string,
    raw: data,
  };
}

export async function validateSslCommerzPayment(valId: string) {
  ensureSslCommerzConfig();

  const url = `${getSslCommerzBaseUrl()}/validator/api/validationserverAPI.php`;
  const { data } = await axios.get(url, {
    params: {
      val_id: valId,
      store_id: env.SSLCOMMERZ_STORE_ID,
      store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
      format: 'json',
    },
  });

  return data as Record<string, unknown>;
}
