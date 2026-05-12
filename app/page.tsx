import { redirect } from "next/navigation";

import { MissingConfigPanel } from "@/components/setup/missing-config-panel";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getOptionalUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!hasSupabaseEnv()) {
    return <MissingConfigPanel />;
  }

  const user = await getOptionalUser();

  redirect(user ? "/dashboard" : "/login");
}
