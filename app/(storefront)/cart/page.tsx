import Link from "next/link";
import { getCartItems, getCartIdFromCookie } from "@/lib/cart";
import { formatUsd } from "@/lib/money";
import { updateCartItemAction, removeCartItemAction, applyDiscountCodeAction, removeDiscountCodeAction } from "@/app/actions/cart";
import { priceOrder } from "@/lib/pricing";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CartPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const items = await getCartItems();
  const subtotal = items.reduce((s, i) => s + i.product.priceCents * i.quantity, 0);

  const cartId = getCartIdFromCookie();
  const cart = cartId ? await prisma.cart.findUnique({ where: { id: cartId } }) : null;

  const pricing = priceOrder(subtotal, cart?.discountCode || undefined);

  if (items.length === 0) {
    return (
      <>
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link className="btn" href="/">
          Continue shopping
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>Your cart</h1>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Unit price</th>
            <th>Quantity</th>
            <th>Line total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.product.name}</td>
              <td>{formatUsd(i.product.priceCents)}</td>
              <td>
                <form action={updateCartItemAction} style={{ display: "flex", gap: "0.5rem" }}>
                  <input type="hidden" name="itemId" value={i.id} />
                  <input
                    type="number"
                    name="quantity"
                    defaultValue={i.quantity}
                    min={1}
                    max={i.product.stock}
                    style={{ width: 70 }}
                    aria-label={`Quantity for ${i.product.name}`}
                  />
                  <button type="submit">Update</button>
                </form>
              </td>
              <td>{formatUsd(i.product.priceCents * i.quantity)}</td>
              <td>
                <form action={removeCartItemAction}>
                  <input type="hidden" name="itemId" value={i.id} />
                  <button type="submit">Remove</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Subtotal: {formatUsd(pricing.subtotalCents)}</h2>

      <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
        <h3>Apply Discount Code</h3>
        {searchParams.error && (
          <p style={{ color: "red", marginBottom: "0.5rem" }}>{searchParams.error}</p>
        )}
        <form action={applyDiscountCodeAction} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text"
            name="discountCode"
            placeholder="Enter discount code"
            aria-label="Discount code"
          />
          <button type="submit">Apply</button>
        </form>
      </div>

      {cart?.discountCode && (
        <div style={{ marginBottom: "1rem", padding: "0.5rem", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
          <p>
            Discount ({cart.discountCode}, {pricing.subtotalCents > 0 ? Math.round((pricing.discountCents / pricing.subtotalCents) * 100) : 0}% off): -
            {formatUsd(pricing.discountCents)}
          </p>
          <form action={removeDiscountCodeAction} style={{ display: "inline" }}>
            <button type="submit">Remove Discount</button>
          </form>
        </div>
      )}

      <div style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
        <p>Subtotal: {formatUsd(pricing.subtotalCents)}</p>
        {pricing.discountCents > 0 && (
          <p style={{ color: "green" }}>Discount: -{formatUsd(pricing.discountCents)}</p>
        )}
        <p>Shipping: {pricing.shippingCents === 0 ? "FREE" : formatUsd(pricing.shippingCents)}</p>
        <p>Tax: {formatUsd(pricing.taxCents)}</p>
        <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>Total: {formatUsd(pricing.totalCents)}</p>
      </div>

      <Link className="btn" href="/checkout">
        Proceed to Checkout
      </Link>
    </>
  );
}
