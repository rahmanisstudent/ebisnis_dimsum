import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, getProductImageUrl } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import type { OrderWithItems } from "@/types";
import { ArrowLeft, Package, User, MapPin, CreditCard } from "lucide-react";
import AdminOrderStatusButtons from "./status-buttons";

interface Props { params: Promise<{ id: string }>; }

export const metadata = { title: "Detail Pesanan" };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*))")
    .eq("id", id)
    .single();

  if (error || !order) notFound();
  const o = order as OrderWithItems;

  // Fetch customer info
  const { data: customer } = await supabase.from("users").select("email").eq("id", o.user_id).single();
  const { data: profile } = await supabase.from("user_profiles").select("full_name, phone, address, district, sub_district, city").eq("id", o.user_id).single();

  const statusColor = ORDER_STATUS_COLORS[o.status] ?? "bg-gray-800 text-gray-400";
  const statusLabel = ORDER_STATUS_LABELS[o.status] ?? o.status;
  const subtotal = o.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft size={16} /> Kembali ke Pesanan
      </Link>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Pesanan #{o.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${statusColor}`}>{statusLabel}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-2">
              <Package size={16} className="text-emerald-400" />
              <h2 className="text-white font-bold">Item Pesanan</h2>
              <span className="text-gray-500 text-xs ml-auto">{o.order_items.length} item</span>
            </div>
            <div className="divide-y divide-gray-800">
              {o.order_items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 items-center">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-800 shrink-0">
                    {item.product && <Image src={getProductImageUrl(item.product.image_url)} alt={item.product.name} fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{item.product?.name ?? "Produk"}</p>
                    <p className="text-gray-500 text-xs">{item.quantity} x {formatPrice(item.price)}</p>
                    {item.variant_name && <p className="text-emerald-400 text-xs mt-0.5">Varian: {item.variant_name}</p>}
                  </div>
                  <span className="text-white font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Customer Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><User size={14} className="text-emerald-400" /> Pelanggan</h3>
            <div className="text-sm flex flex-col gap-1.5">
              <p className="text-white font-medium">{profile?.full_name || "Nama belum diisi"}</p>
              <p className="text-gray-400">{customer?.email}</p>
              {profile?.phone && <p className="text-gray-400">{profile.phone}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><MapPin size={14} className="text-emerald-400" /> Alamat Pengiriman</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {o.shipping_address || profile?.address
                ? (o.shipping_address || [profile?.address, profile?.sub_district, profile?.district, profile?.city].filter(Boolean).join(", "))
                : "Alamat belum diisi"}
            </p>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><CreditCard size={14} className="text-emerald-400" /> Pembayaran</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-white">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-gray-400"><span>Ongkir</span><span className="text-white">{formatPrice(o.shipping_cost || (o.total_price - subtotal))}</span></div>
              {o.discount_amount > 0 && <div className="flex justify-between text-gray-400"><span>Diskon</span><span className="text-emerald-400">-{formatPrice(o.discount_amount)}</span></div>}
              <div className="border-t border-gray-800 my-1" />
              <div className="flex justify-between text-white font-extrabold"><span>Total</span><span>{formatPrice(o.total_price)}</span></div>
            </div>
            {o.midtrans_order_id && <p className="text-gray-600 text-xs mt-3 font-mono truncate">Midtrans: {o.midtrans_order_id}</p>}
          </div>

          {/* Status Actions */}
          <AdminOrderStatusButtons orderId={o.id} currentStatus={o.status} />
        </div>
      </div>
    </div>
  );
}
