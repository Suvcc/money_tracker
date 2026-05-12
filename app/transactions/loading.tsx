import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TransactionsLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(67,97,238,0.18),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef4f8_45%,_#e8f0f4_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 pb-28 sm:gap-8 sm:px-6 sm:py-6 sm:pb-32 lg:px-10 lg:pb-10">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,64,175,0.95)_52%,_rgba(5,150,105,0.9)_100%)] px-6 py-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:px-8 sm:py-7">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded-full bg-white/20" />
            <div className="h-10 w-64 max-w-full rounded-full bg-white/18" />
            <div className="h-4 w-[30rem] max-w-full rounded-full bg-white/14" />
            <div className="flex flex-wrap gap-3 pt-4">
              <div className="h-10 w-32 rounded-full bg-white/14" />
              <div className="h-10 w-36 rounded-full bg-white/10" />
              <div className="h-10 w-40 rounded-full bg-white/10" />
            </div>
          </div>
        </div>

        <LoadingCard lines={4} titleWidth="w-40" />
        <Card>
          <CardHeader>
            <div className="h-7 w-44 animate-pulse rounded-full bg-slate-200" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="grid animate-pulse gap-3 rounded-[1.4rem] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] md:grid-cols-6"
                >
                  <div className="h-5 rounded-full bg-slate-100" />
                  <div className="h-5 rounded-full bg-slate-100 md:col-span-2" />
                  <div className="h-5 rounded-full bg-slate-100" />
                  <div className="h-5 rounded-full bg-slate-100" />
                  <div className="h-5 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function LoadingCard({
  lines,
  titleWidth,
}: {
  lines: number;
  titleWidth: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className={`h-7 animate-pulse rounded-full bg-slate-200 ${titleWidth}`} />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: lines }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
