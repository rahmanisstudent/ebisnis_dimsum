"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminOrderStatusButtons({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function markAsSelesai() {
    setUpdating(true);
    await supabase.from("orders").update({ status: "selesai" }).eq("id", orderId);
    setUpdating(false);
    router.refresh();
  }

  if (currentStatus !== "paid") return null;

  return (
    <button onClick={markAsSelesai} disabled={updating}
      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-3 rounded-xl transition-all text-sm">
      {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
      {updating ? "Memproses..." : "Tandai Selesai"}
    </button>
  );
}
