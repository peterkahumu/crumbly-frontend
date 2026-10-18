import { formatPrice } from "@/lib/currency";

/**
 * Normalizes a phone number to digits-only with country code, suitable for
 * wa.me links. Accepts local Kenyan formats like "07xx..." and turns them
 * into "2547xx...". Leaves already-international numbers untouched.
 */
export function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

/**
 * Builds the prefilled order message a customer sends to the baker's
 * WhatsApp Business number at checkout.
 */
export function buildOrderMessage({ bakeryName, items, totalAmount, customerName }) {
  const lines = [
    `Hi ${bakeryName}! I'd like to place an order via Crumbly.`,
    "",
    ...items.map((item) => `• ${item.name} (x${item.qty}) — ${formatPrice(item.price * item.qty)}`),
    "",
    `Total: ${formatPrice(totalAmount)}`,
  ];
  if (customerName) lines.push("", `Name: ${customerName}`);
  return lines.join("\n");
}

/**
 * Builds a wa.me deep link. `whatsappNumber` is the baker's number as stored
 * on the Bakery record (any common format works, it gets normalized).
 */
export function buildWhatsAppLink(whatsappNumber, message) {
  const phone = normalizePhone(whatsappNumber);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
