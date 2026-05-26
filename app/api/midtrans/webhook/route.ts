import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Use Supabase service role key for trusted server-side updates
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

/**
 * POST /api/midtrans/webhook
 *
 * Receives Midtrans HTTP notification (server-to-server).
 * Verifies the signature_key, then updates the order status.
 * S02: Auto-reduces stock on payment, restores on cancel/expire.
 */
export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();

    const {
      order_id: midtransOrderId,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
    } = notification;

    // ── 1. Verify Midtrans signature ────────────────────────────────────────
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: "Server key missing" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${midtransOrderId}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (expectedSignature !== signature_key) {
      console.warn("Invalid Midtrans signature for order:", midtransOrderId);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // ── 2. Map Midtrans status to app status ────────────────────────────────
    let appStatus: string | null = null;

    if (
      transaction_status === "capture" &&
      fraud_status === "accept"
    ) {
      appStatus = "paid";
    } else if (transaction_status === "settlement") {
      appStatus = "paid";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny"
    ) {
      appStatus = "cancelled";
    } else if (transaction_status === "expire") {
      appStatus = "expired";
    } else if (transaction_status === "pending") {
      appStatus = "pending";
    }

    if (!appStatus) {
      // Unhandled status — log and return 200 so Midtrans stops retrying
      console.log("Unhandled Midtrans status:", transaction_status);
      return NextResponse.json({ received: true });
    }

    // ── 3. Update order in Supabase (service role, bypasses RLS) ───────────
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current order status before updating
    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("midtrans_order_id", midtransOrderId)
      .single();

    const previousStatus = currentOrder?.status;

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: appStatus })
      .eq("midtrans_order_id", midtransOrderId);

    if (error) {
      console.error("Failed to update order status:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── 4. S02: Auto-reduce / restore stock ─────────────────────────────────
    // Only process stock changes when status actually changes
    if (previousStatus !== appStatus) {
      // Get order items for this order
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("midtrans_order_id", midtransOrderId)
        .single();

      if (order) {
        const { data: orderItems } = await supabaseAdmin
          .from("order_items")
          .select("product_id, quantity, variant_id")
          .eq("order_id", order.id);

        if (orderItems && orderItems.length > 0) {
          // Reduce stock when payment is confirmed
          if (appStatus === "paid" && previousStatus !== "paid") {
            for (const item of orderItems) {
              if (item.variant_id) {
                // If variant exists, decrement variant stock
                const { data: variant } = await supabaseAdmin
                  .from("product_variants")
                  .select("stock")
                  .eq("id", item.variant_id)
                  .single();

                if (variant) {
                  const newStock = Math.max(0, variant.stock - item.quantity);
                  await supabaseAdmin
                    .from("product_variants")
                    .update({ stock: newStock })
                    .eq("id", item.variant_id);
                }
              } else {
                // Standard product stock
                await supabaseAdmin.rpc("decrement_stock", {
                  p_product_id: item.product_id,
                  p_quantity: item.quantity,
                }).then(({ error: rpcError }) => {
                  if (rpcError) {
                    return supabaseAdmin
                      .from("products")
                      .select("stock")
                      .eq("id", item.product_id)
                      .single()
                      .then(({ data: product }) => {
                        if (product) {
                          const newStock = Math.max(0, product.stock - item.quantity);
                          return supabaseAdmin
                            .from("products")
                            .update({ stock: newStock })
                            .eq("id", item.product_id);
                        }
                      });
                  }
                });
              }
            }
            console.log(`[Stock] Reduced stock for order ${midtransOrderId}`);
          }

          // Restore stock when order is cancelled or expired
          if (
            (appStatus === "cancelled" || appStatus === "expired") &&
            previousStatus === "paid"
          ) {
            for (const item of orderItems) {
              if (item.variant_id) {
                const { data: variant } = await supabaseAdmin
                  .from("product_variants")
                  .select("stock")
                  .eq("id", item.variant_id)
                  .single();

                if (variant) {
                  await supabaseAdmin
                    .from("product_variants")
                    .update({ stock: variant.stock + item.quantity })
                    .eq("id", item.variant_id);
                }
              } else {
                const { data: product } = await supabaseAdmin
                  .from("products")
                  .select("stock")
                  .eq("id", item.product_id)
                  .single();

                if (product) {
                  await supabaseAdmin
                    .from("products")
                    .update({ stock: product.stock + item.quantity })
                    .eq("id", item.product_id);
                }
              }
            }
            console.log(`[Stock] Restored stock for order ${midtransOrderId}`);
          }
        }
      }
    }

    console.log(
      `Order ${midtransOrderId} updated to status: ${appStatus}`
    );

    return NextResponse.json({ received: true, status: appStatus });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
