"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  function handleLogout() {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-500 hover:text-amber-400 hover:bg-gray-800 transition-all text-sm font-medium"
    >
      {isPending ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <LogOut size={15} />
      )}
      Keluar
    </button>
  );
}
