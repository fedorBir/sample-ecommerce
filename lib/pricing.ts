export function validateDiscountCode(code: string): { valid: boolean; percentOff: number } {
  const upperCode = code.toUpperCase();
  const discountCodes: Record<string, number> = {
    SAVE10: 10,
    WELCOME15: 15,
  };

  if (discountCodes[upperCode]) {
    return { valid: true, percentOff: discountCodes[upperCode] };
  }
  return { valid: false, percentOff: 0 };
}

export function applyDiscount(subtotalCents: number, percentOff: number): number {
  return Math.round(subtotalCents * (percentOff / 100));
}

export function priceOrder(subtotalCents: number, discountCode?: string) {
  const flat = Number(process.env.SHIPPING_FLAT_CENTS || 500);
  const freeThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD_CENTS || 5000);
  const taxRate = Number(process.env.TAX_RATE || 0.08);

  let discountCents = 0;
  let discountedSubtotalCents = subtotalCents;

  if (discountCode) {
    const validation = validateDiscountCode(discountCode);
    if (validation.valid) {
      discountCents = applyDiscount(subtotalCents, validation.percentOff);
      discountedSubtotalCents = subtotalCents - discountCents;
    }
  }

  const shippingCents = discountedSubtotalCents >= freeThreshold ? 0 : flat;
  const taxCents = Math.round(discountedSubtotalCents * taxRate);
  const totalCents = discountedSubtotalCents + shippingCents + taxCents;
  return { subtotalCents, discountCents, discountedSubtotalCents, shippingCents, taxCents, totalCents };
}
