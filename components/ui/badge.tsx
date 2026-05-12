import { cn } from "@/lib/utils";

const variants = {
  default: "bg-slate-950 text-white",
  outline: "border border-slate-200 bg-white text-slate-700",
  expense: "bg-rose-100 text-rose-700",
  income: "bg-emerald-100 text-emerald-700",
} as const;

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
