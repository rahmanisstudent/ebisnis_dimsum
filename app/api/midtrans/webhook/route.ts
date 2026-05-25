import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Use Supabase service role key for trusted server-side updates
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

/**
 * POST /api/midtrans/webhook
 *
 * Receives Midtrans HTTP notification (server-to-server).
 * Verifies the signature_key, then updates the order status.
 *
 * Midtrans status → orders.status mapping:
 *  settlement  → paid
 *  capture     → paid  (credit card)
 *  cancel      → cancelled
 *  deny        → cancelled
 *  expire      → expired
 *  pending     → pending  (no change needed)
 *
 * IMPORTANT: Set this URL in your Midtrans dashboard under
 * Settings → Configuration → Payment Notification URL
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

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: appStatus })
      .eq("midtrans_order_id", midtransOrderId);

    if (error) {
      console.error("Failed to update order status:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
