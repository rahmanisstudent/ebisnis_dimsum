"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NavbarAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="w-16 h-5 animate-pulse rounded-lg" style={{ backgroundColor: '#EDE8E3' }}></div>;
  }

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-semibold transition-colors duration-200" style={{ color: '#8A857E' }}>
        Masuk
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex items-center gap-2 text-sm font-medium" style={{ color: '#8A857E' }}>
        <UserIcon size={16} style={{ color: '#4A7C59', opacity: 0.6 }} />
        <span className="truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5"
        style={{ color: '#8A857E' }}
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Keluar</span>
      </button>
    </div>
  );
}
