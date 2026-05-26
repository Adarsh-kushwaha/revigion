"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ProfileDropdownProps {
  email: string;
}

export function ProfileDropdown({ email }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    startTransition(() => {
      router.push("/login");
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
        style={{ backgroundColor: "rgba(17,17,16,0.08)", color: "#111110" }}
        aria-label="Profile menu"
      >
        {email.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-72 rounded-xl shadow-lg border z-50 overflow-hidden"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "rgba(17,17,16,0.08)",
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(17,17,16,0.08)" }}>
            <p className="text-xs" style={{ color: "#6B6A65" }}>
              Signed in as
            </p>
            <p className="text-sm font-medium truncate" style={{ color: "#111110" }}>
              {email}
            </p>
          </div>

          <div className="px-4 py-3">
            <button
              onClick={handleSignOut}
              disabled={isPending}
              className="w-full text-sm text-left rounded-lg px-2 py-1.5 transition-colors"
              style={{ color: "#111110" }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#F5F5F1")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {isPending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
