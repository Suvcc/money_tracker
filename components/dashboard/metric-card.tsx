import { cn } from "@/lib/utils";

const tones = {
  expense:
    "border-rose-200/80 bg-[linear-gradient(180deg,_#fff8f8_0%,_#fff1f2_100%)] text-rose-950",
  income:
    "border-emerald-200/80 bg-[linear-gradient(180deg,_#f5fffa_0%,_#ecfdf5_100%)] text-emerald-950",
  neutral:
    "border-blue-200/80 bg-[linear-gradient(180deg,_#f6faff_0%,_#eef4ff_100%)] text-blue-950",
} as const;

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  tone: keyof typeof tones;
};

export function MetricCard({
  label,
  value,
  description,
  tone,
}: MetricCardProps) {
  return (
    <article
      className={cn(
        "rounded-[1.65rem] border px-5 py-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)]",
        tones[tone],
      )}
    >
      <p className="text-sm font-medium text-current/70">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-3 text-sm leading-6 text-current/72">{description}</p>
    </article>
  );
}
