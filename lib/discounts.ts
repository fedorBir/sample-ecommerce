import "server-only";
import { cookies } from "next/headers";
import { formatUsd } from "./money";

const DISCOUNT_COOKIE = "discountCode";

export const DISCOUNT_CODES: Record<string, number> = { SAVE10: 10, WELCOME15: 15 };

export type Discount = { code: string; percent: number };

export function normalizeDiscountCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function findDiscount(raw: string): Discount | null {
  const code = normalizeDiscountCode(raw);
  if (!Object.prototype.hasOwnProperty.call(DISCOUNT_CODES, code)) return null;
  return { code, percent: DISCOUNT_CODES[code] };
}

export function discountCents(subtotalCents: number, percent: number): number {
  return Math.round((subtotalCents * percent) / 100);
}

export function discountLine(d: { code: string; percent: number }, cents: number): string {
  return `Discount (${d.code}, ${d.percent}% off): -${formatUsd(cents)}`;
}

/** Read-only: returns the applied discount from the cookie, re-validated, or null. */
export function getAppliedDiscount(): Discount | null {
  const value = cookies().get(DISCOUNT_COOKIE)?.value;
  return value ? findDiscount(value) : null;
}

/** Mutating: stores the applied discount code in the cookie. Server Action / Route only. */
export function setAppliedDiscount(code: string): void {
  cookies().set(DISCOUNT_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Mutating: removes the applied discount code cookie. Server Action / Route only. */
export function clearAppliedDiscount(): void {
  cookies().delete(DISCOUNT_COOKIE);
}
