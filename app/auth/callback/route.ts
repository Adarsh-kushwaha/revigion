import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ timezone: 'Asia/Calcutta' })
        .eq("id", data.user.id);
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}
