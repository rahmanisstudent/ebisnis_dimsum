import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, rating, comment } = body;

    // ── Validate input ──────────────────────────────────────────────────────
    if (!product_id || typeof product_id !== "string") {
      return NextResponse.json({ error: "product_id tidak valid" }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating harus antara 1–5" }, { status: 400 });
    }

    // ── Auth check ──────────────────────────────────────────────────────────
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login untuk memberikan ulasan" },
        { status: 401 }
      );
    }

    // ── Admin client (bypass RLS for validation queries) ────────────────────
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── 1. Find paid/completed orders belonging to this user ─────────────────
    // 'paid' = payment confirmed by Midtrans, 'selesai' = delivery confirmed
    const { data: completedOrders } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["paid", "selesai"]);

    if (!completedOrders || completedOrders.length === 0) {
      return NextResponse.json(
        { error: "Anda belum memiliki pesanan yang selesai" },
        { status: 403 }
      );
    }

    const orderIds = completedOrders.map((o: any) => o.id);

    // ── 2. Verify product exists in one of those orders ─────────────────────
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("order_id")
      .in("order_id", orderIds)
      .eq("product_id", product_id)
      .limit(1);

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: "Anda belum membeli produk ini" },
        { status: 403 }
      );
    }

    const orderId = (orderItems[0] as any).order_id;

    // ── 3. Check for duplicate review ───────────────────────────────────────
    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { error: "Anda sudah memberikan ulasan untuk produk ini" },
        { status: 409 }
      );
    }

    // ── 4. Insert review ────────────────────────────────────────────────────
    const { error: insertError } = await supabaseAdmin
      .from("reviews")
      .insert({
        user_id: user.id,
        product_id,
        order_id: orderId,
        rating: Math.round(Math.min(5, Math.max(1, rating))),
        comment: comment?.trim() || null,
      });

    if (insertError) {
      console.error("[Reviews API] Insert error:", insertError);
      return NextResponse.json({ error: "Gagal menyimpan ulasan" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Reviews API] Unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
