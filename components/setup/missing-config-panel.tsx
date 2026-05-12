import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MissingConfigPanel() {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#f8fbff_0%,_#edf3f6_100%)] px-5 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Supabase configuration required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            Add the following environment variables before using the authenticated
            dashboard:
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-slate-800">
            NEXT_PUBLIC_SUPABASE_URL
            <br />
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </div>
          <p>
            Once they are set, the root route will send signed-in users to the
            dashboard and everyone else to the login screen.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
