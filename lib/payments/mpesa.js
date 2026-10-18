/**
 * M-Pesa (Safaricom Daraja API) integration — STUBBED.
 *
 * Checkout currently hands orders off to WhatsApp. This module documents the
 * shape of the Daraja STK Push flow so M-Pesa can be wired in later without
 * redesigning the checkout/order flow:
 *
 *   1. POST /oauth/v1/generate?grant_type=client_credentials (Basic auth with
 *      MPESA_CONSUMER_KEY:MPESA_CONSUMER_SECRET) -> access_token
 *   2. POST /mpesa/stkpush/v1/processrequest with { BusinessShortCode,
 *      Password (base64 of Shortcode+Passkey+Timestamp), Timestamp,
 *      TransactionType: "CustomerPayBillOnline", Amount, PartyA (customer
 *      MSISDN), PartyB (Shortcode), PhoneNumber, CallBackURL, AccountReference,
 *      TransactionDesc } -> CheckoutRequestID
 *   3. Safaricom calls MPESA_CALLBACK_URL with the result; verify it, then
 *      update the matching Order's status/mpesaReceiptNumber.
 *
 * Required env vars (see .env.example): MPESA_CONSUMER_KEY,
 * MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL.
 */

export const MPESA_ENABLED = Boolean(
  process.env.MPESA_CONSUMER_KEY && process.env.MPESA_SHORTCODE && process.env.MPESA_PASSKEY
);

export async function initiateStkPush(/* { phone, amount, accountReference } */) {
  throw new Error(
    "M-Pesa is not configured yet. Set MPESA_* env vars and implement initiateStkPush() in lib/payments/mpesa.js."
  );
}
