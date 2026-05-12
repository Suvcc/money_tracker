import { cn } from "@/lib/utils";

const variants = {
  default:
    "bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800",
  secondary:
    "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
