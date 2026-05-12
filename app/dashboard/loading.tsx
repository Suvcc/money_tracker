import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(67,97,238,0.18),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef4f8_45%,_#e8f0f4_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 pb-28 sm:gap-8 sm:px-6 sm:py-6 sm:pb-32 lg:px-10 lg:pb-10">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,64,175,0.95)_52%,_rgba(5,150,105,0.9)_100%)] px-6 py-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:px-8 sm:py-7">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded-full bg-white/20" />
            <div className="h-10 w-80 max-w-full rounded-full bg-white/18" />
            <div className="h-4 w-[32rem] max-w-full rounded-full bg-white/14" />
            <div className="flex flex-wrap gap-3 pt-4">
              <div className="h-10 w-32 rounded-full bg-white/14" />
              <div className="h-10 w-36 rounded-full bg-white/10" />
              <div className="h-10 w-40 rounded-full bg-white/10" />
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[1.65rem] border border-slate-200/80 bg-white/85 px-5 py-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]"
            >
              <div className="h-4 w-28 rounded-full bg-slate-200" />
              <div className="mt-4 h-8 w-32 rounded-full bg-slate-200" />
              <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
              <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-100" />
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.95fr)]">
          <LoadingCard className="min-h-[360px]" />
          <LoadingCard className="min-h-[360px]" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <LoadingCard className="min-h-[360px]" />
          <LoadingCard className="min-h-[360px]" />
        </section>
      </div>
    </main>
  );
}

function LoadingCard({ className = "" }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="h-7 w-44 animate-pulse rounded-full bg-slate-200" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-5 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-5 w-11/12 animate-pulse rounded-full bg-slate-100" />
          <div className="h-5 w-4/5 animate-pulse rounded-full bg-slate-100" />
          <div className="h-48 animate-pulse rounded-[1.4rem] bg-slate-100" />
        </div>
      </CardContent>
    </Card>
  );
}
