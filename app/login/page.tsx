import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { MissingConfigPanel } from "@/components/setup/missing-config-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getOptionalUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!hasSupabaseEnv()) {
    return <MissingConfigPanel />;
  }

  const user = await getOptionalUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(5,150,105,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(180deg,_#f9fbfd_0%,_#edf3f6_100%)] px-5 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
      <section className="flex items-center justify-center">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/65 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-10">
          <Badge className="w-fit">Money Finance</Badge>
          <div className="space-y-4">
            <h1 className="max-w-xl font-serif text-4xl leading-tight text-slate-950 sm:text-5xl">
              Build around real spending, not spreadsheet drift.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Track confirmed transactions, watch recurring commitments, and
              keep the current month in focus with a clean financial control
              room.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-slate-200/80 bg-white/85 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Actual spending</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Transactions stay separate from future commitments.
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/85 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recurring load</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Upcoming renewals stay visible before they hit the account.
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/85 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily clarity</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Monthly charts and recent activity make the dashboard readable at
                a glance.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center py-8">
        <SignInForm />
      </section>
    </main>
  );
}
