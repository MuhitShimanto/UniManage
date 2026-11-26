import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '',
  REDIS_URL: process.env.REDIS_URL || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  BKASH_BASE_URL: process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  BKASH_APP_KEY: process.env.BKASH_APP_KEY || '',
  BKASH_APP_SECRET: process.env.BKASH_APP_SECRET || '',
  BKASH_USERNAME: process.env.BKASH_USERNAME || '',
  BKASH_PASSWORD: process.env.BKASH_PASSWORD || '',
  BKASH_CALLBACK_URL:
    process.env.BKASH_CALLBACK_URL || 'http://localhost:5000/api/v1/payments/bkash/callback',
  SSLCOMMERZ_STORE_ID: process.env.SSLCOMMERZ_STORE_ID || '',
  SSLCOMMERZ_STORE_PASSWORD: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
  SSLCOMMERZ_IS_LIVE: process.env.SSLCOMMERZ_IS_LIVE === 'true',
  SSLCOMMERZ_SUCCESS_URL:
    process.env.SSLCOMMERZ_SUCCESS_URL || 'http://localhost:5000/api/v1/payments/sslcommerz/success',
  SSLCOMMERZ_FAIL_URL:
    process.env.SSLCOMMERZ_FAIL_URL || 'http://localhost:5000/api/v1/payments/sslcommerz/fail',
  SSLCOMMERZ_CANCEL_URL:
    process.env.SSLCOMMERZ_CANCEL_URL || 'http://localhost:5000/api/v1/payments/sslcommerz/cancel',
  SSLCOMMERZ_IPN_URL:
    process.env.SSLCOMMERZ_IPN_URL || 'http://localhost:5000/api/v1/payments/sslcommerz/ipn',
};
