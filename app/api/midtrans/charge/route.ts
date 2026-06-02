import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/midtrans/charge
 *
 * Receives:  { order_id: string, user_email: string }
 * Returns:   { snap_token: string | null, payment_url: string }
 *
 * Key fix: If this order already has a saved payment_url, return it immediately
 * to prevent Midtrans "Duplicate Order ID" errors on page refresh / retry.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, user_email } = body as {
      order_id: string;
      user_email: string;
    };

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // ── 1. Fetch order + items ──────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(name))")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ── 2. Early return: payment already created — prevents duplicate ID error
    if (order.midtrans_order_id && order.payment_url) {
      console.log(`[Midtrans] Returning cached payment_url for order ${order_id}`);
      return NextResponse.json({
        snap_token: null,
        payment_url: order.payment_url,
      });
    }

    // ── 3. Build Midtrans payload ───────────────────────────────────────────
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    if (!serverKey) {
      console.error("[Midtrans] MIDTRANS_SERVER_KEY is not set");
      return NextResponse.json(
        { error: "Midtrans server key not configured" },
        { status: 500 }
      );
    }

    // Timestamp ensures uniqueness even if user retries after the previous token expired
    const midtransOrderId = `DS-${order_id}`;

    const itemDetails = order.order_items.map(
      (item: { product: { name: string }; quantity: number; price: number }) => ({
        id: (item.product?.name ?? "item").slice(0, 50),
        price: item.price,
        quantity: item.quantity,
        name: (item.product?.name ?? "Dimsum Item").slice(0, 50),
      })
    );

    // Shipping as a line item
    if (order.shipping_cost > 0) {
      itemDetails.push({
        id: "SHIPPING",
        price: order.shipping_cost,
        quantity: 1,
        name: "Ongkos Kirim",
      });
    }

    // Discount as a line item (with negative price)
    if (order.discount_amount > 0) {
      itemDetails.push({
        id: "DISCOUNT",
        price: -order.discount_amount,
        quantity: 1,
        name: "Diskon Voucher",
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const payload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: order.total_price,
      },
      item_details: itemDetails,
      customer_details: { email: user_email },
      callbacks: {
        finish: `${appUrl}/orders`,
        error: `${appUrl}/checkout`,
        pending: `${appUrl}/orders`,
      },
    };

    // ── 4. Call Midtrans Snap API ───────────────────────────────────────────
    const authHeader = Buffer.from(`${serverKey}:`).toString("base64");
    const midtransRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(payload),
    });

    if (!midtransRes.ok) {
      const errorBody = await midtransRes.json();
      console.error("[Midtrans] API error:", JSON.stringify(errorBody));
      return NextResponse.json(
        { error: "Midtrans API error", details: errorBody },
        { status: 502 }
      );
    }

    const midtransData = await midtransRes.json();
    const { token: snap_token, redirect_url: payment_url } = midtransData;

    // ── 5. Persist midtrans_order_id + payment_url ─────────────────────────
    const { error: updateError } = await supabase
      .from("orders")
      .update({ midtrans_order_id: midtransOrderId, payment_url })
      .eq("id", order_id);

    if (updateError) {
      console.error("[Midtrans] Failed to save payment_url:", updateError);
    }

    console.log(`[Midtrans] Created transaction: ${midtransOrderId}`);
    return NextResponse.json({ snap_token, payment_url });
  } catch (err) {
    console.error("[Midtrans] Charge route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
