import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createSupabaseUser } from "@/lib/supabase/server";
import { calculateShippingCost } from "@/lib/utils";

interface CheckoutItem {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
}

interface CheckoutBody {
  items: CheckoutItem[];
  shipping_address: string;
  sub_district?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  voucher_code?: string | null;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const {
      items,
      shipping_address,
      sub_district,
      district,
      latitude,
      longitude,
      voucher_code,
      guest_name,
      guest_email,
      guest_phone,
    } = body;

    // Validate input items
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Keranjang belanja kosong" }, { status: 400 });
    }

    if (!shipping_address) {
      return NextResponse.json({ error: "Alamat pengiriman wajib diisi" }, { status: 400 });
    }

    // Initialize Supabase Clients
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const supabaseUser = await createSupabaseUser();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    const userId = user?.id ?? null;
    const userEmail = user?.email ?? null;

    // Guest checkout validation
    if (!userId) {
      if (!guest_name || !guest_email || !guest_phone) {
        return NextResponse.json(
          { error: "Untuk pembelian tanpa login, nama, email, dan telepon wajib diisi" },
          { status: 400 }
        );
      }
    }

    // ── 1. Fetch products & variants from DB to prevent price tampering ──
    const productIds = items.map((i) => i.product_id);
    const { data: dbProducts, error: dbProductsError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, stock")
      .in("id", productIds);

    if (dbProductsError || !dbProducts) {
      console.error("[Checkout API] Fetch products error:", dbProductsError);
      return NextResponse.json({ error: "Gagal memproses data produk" }, { status: 500 });
    }

    const variantIds = items.filter((i) => i.variant_id).map((i) => i.variant_id!);
    let dbVariants: any[] = [];
    if (variantIds.length > 0) {
      const { data: variantsData, error: variantsError } = await supabaseAdmin
        .from("product_variants")
        .select("id, product_id, name, price_adjustment, stock")
        .in("id", variantIds);

      if (variantsError) {
        console.error("[Checkout API] Fetch variants error:", variantsError);
        return NextResponse.json({ error: "Gagal memproses varian produk" }, { status: 500 });
      }
      dbVariants = variantsData ?? [];
    }

    // ── 2. Validate stock and calculate subtotal ──
    let subtotal = 0;
    const orderItemsToInsert: any[] = [];

    for (const item of items) {
      const dbProd = dbProducts.find((p) => p.id === item.product_id);
      if (!dbProd) {
        return NextResponse.json(
          { error: `Produk dengan ID ${item.product_id} tidak ditemukan` },
          { status: 404 }
        );
      }

      let price = dbProd.price;
      let variantName: string | null = null;

      if (item.variant_id) {
        const dbVar = dbVariants.find((v) => v.id === item.variant_id);
        if (!dbVar) {
          return NextResponse.json(
            { error: `Varian dengan ID ${item.variant_id} tidak ditemukan` },
            { status: 404 }
          );
        }
        price += dbVar.price_adjustment ?? 0;
        variantName = dbVar.name;

        // Check variant stock
        if (dbVar.stock < item.quantity) {
          return NextResponse.json(
            { error: `Stok untuk varian "${dbVar.name}" tidak mencukupi (Tersedia: ${dbVar.stock})` },
            { status: 400 }
          );
        }
      } else {
        // Check product stock
        if (dbProd.stock < item.quantity) {
          return NextResponse.json(
            { error: `Stok untuk produk "${dbProd.name}" tidak mencukupi (Tersedia: ${dbProd.stock})` },
            { status: 400 }
          );
        }
      }

      subtotal += price * item.quantity;

      orderItemsToInsert.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        variant_name: variantName,
        quantity: item.quantity,
        price: price,
      });
    }

    // ── 3. Calculate shipping cost ──
    const { cost: shippingCost, distance } = calculateShippingCost(
      sub_district,
      district,
      latitude,
      longitude
    );

    // ── 4. Validate and apply voucher ──
    let discountAmount = 0;
    let dbVoucher: any = null;

    if (voucher_code) {
      const { data: voucher } = await supabaseAdmin
        .from("vouchers")
        .select("*")
        .eq("code", voucher_code.toUpperCase().trim())
        .single();

      if (voucher) {
        const now = new Date();
        const validFrom = new Date(voucher.valid_from);
        const validUntil = new Date(voucher.valid_until);
        const isActive = voucher.is_active;
        const minPurchase = voucher.min_purchase ?? 0;

        if (
          isActive &&
          now >= validFrom &&
          now <= validUntil &&
          subtotal >= minPurchase
        ) {
          if (!voucher.max_uses || voucher.used_count < voucher.max_uses) {
            dbVoucher = voucher;
            if (voucher.discount_type === "fixed") {
              discountAmount = voucher.discount_value;
            } else {
              discountAmount = Math.round((subtotal * voucher.discount_value) / 100);
            }
            // discount cannot exceed subtotal
            discountAmount = Math.min(discountAmount, subtotal);
          }
        }
      }
    }

    const totalPrice = Math.max(0, subtotal + shippingCost - discountAmount);

    // ── 5. Insert order record (Server-Side using admin client) ──
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        total_price: totalPrice,
        status: "pending",
        shipping_cost: shippingCost,
        shipping_address: shipping_address,
        voucher_id: dbVoucher?.id || null,
        discount_amount: discountAmount,
        guest_name: userId ? null : guest_name,
        guest_email: userId ? null : guest_email,
        guest_phone: userId ? null : guest_phone,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("[Checkout API] Order insert error:", orderError);
      return NextResponse.json({ error: "Gagal membuat pesanan baru di database" }, { status: 500 });
    }

    // ── 6. Insert order items ──
    const itemsToInsert = orderItemsToInsert.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("[Checkout API] Order items insert error:", itemsError);
      // Clean up order
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "Gagal menyimpan rincian pesanan" }, { status: 500 });
    }

    // ── 7. Update voucher usage count ──
    if (dbVoucher) {
      await supabaseAdmin
        .from("vouchers")
        .update({ used_count: dbVoucher.used_count + 1 })
        .eq("id", dbVoucher.id);
    }

    // ── 8. Call Midtrans Snap API ──
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    if (!serverKey) {
      console.error("[Checkout API] MIDTRANS_SERVER_KEY is not set");
      return NextResponse.json({ error: "Kunci pembayaran Midtrans belum dikonfigurasi" }, { status: 500 });
    }

    const midtransOrderId = `DS-${order.id}`;

    // Map item details for Midtrans
    const midtransItems = itemsToInsert.map((item) => {
      const dbProd = dbProducts.find((p) => p.id === item.product_id);
      let name = dbProd?.name ?? "Dimsum Item";
      if (item.variant_name) {
        name += ` (${item.variant_name})`;
      }
      return {
        id: item.product_id.slice(0, 20) + (item.variant_id ? `-${item.variant_id.slice(0, 10)}` : ""),
        price: item.price,
        quantity: item.quantity,
        name: name.slice(0, 50),
      };
    });

    // Add shipping as line item
    if (shippingCost > 0) {
      midtransItems.push({
        id: "SHIPPING",
        price: shippingCost,
        quantity: 1,
        name: "Ongkos Kirim",
      });
    }

    // Add discount as line item
    if (discountAmount > 0) {
      midtransItems.push({
        id: "DISCOUNT",
        price: -discountAmount,
        quantity: 1,
        name: "Diskon Voucher",
      });
    }

    const email = (userId ? userEmail : guest_email) || "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Set callback URL
    const finishCallbackUrl = userId
      ? `${appUrl}/orders`
      : `${appUrl}/orders/track?order_id=${order.id}&email=${encodeURIComponent(email)}`;

    const payload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: totalPrice,
      },
      item_details: midtransItems,
      customer_details: {
        email: email,
        first_name: (userId && userEmail) ? userEmail.split("@")[0] : (guest_name || "Pelanggan"),
        phone: userId ? undefined : guest_phone,
      },
      callbacks: {
        finish: finishCallbackUrl,
        error: `${appUrl}/checkout`,
        finish_redirect_url: finishCallbackUrl,
      },
    };

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
      console.error("[Checkout API] Midtrans API error:", JSON.stringify(errorBody));
      return NextResponse.json({ error: "Gagal menghubungi payment gateway Midtrans" }, { status: 502 });
    }

    const midtransData = await midtransRes.json();
    const { token: snap_token, redirect_url: payment_url } = midtransData;

    // ── 9. Save payment info to database ──
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ midtrans_order_id: midtransOrderId, payment_url })
      .eq("id", order.id);

    if (updateError) {
      console.error("[Checkout API] Failed to save payment_url:", updateError);
    }

    console.log(`[Checkout API] Successfully created order: ${order.id} for guest? ${!userId}`);
    return NextResponse.json({ order_id: order.id, snap_token, payment_url });
  } catch (err) {
    console.error("[Checkout API] Error during checkout route:", err);
    return NextResponse.json({ error: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}
