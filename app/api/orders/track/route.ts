import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { order_id, email } = (await request.json()) as {
      order_id: string;
      email: string;
    };

    if (!order_id || !email) {
      return NextResponse.json({ error: "ID Pesanan dan Email wajib diisi" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Standardize order ID: strip "DS-" prefix if entered
    let cleanOrderId = order_id.trim();
    if (cleanOrderId.startsWith("DS-")) {
      cleanOrderId = cleanOrderId.substring(3);
    }

    // Attempt to parse UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanOrderId)) {
      return NextResponse.json({ error: "Format ID Pesanan tidak valid" }, { status: 400 });
    }

    // Query order and items
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*, product:products(name))")
      .eq("id", cleanOrderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    // Verify email association
    const inputEmailClean = email.toLowerCase().trim();
    let isAuthorized = false;

    if (order.user_id) {
      // Registered user order: fetch email from users profile table
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", order.user_id)
        .single();

      if (userData?.email?.toLowerCase().trim() === inputEmailClean) {
        isAuthorized = true;
      }
    } else {
      // Guest order: verify guest_email
      if (order.guest_email?.toLowerCase().trim() === inputEmailClean) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Email yang Anda masukkan tidak sesuai dengan pesanan ini" },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("[Track API] Error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}
