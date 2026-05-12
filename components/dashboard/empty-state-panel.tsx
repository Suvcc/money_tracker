type EmptyStatePanelProps = {
  title: string;
  description: string;
};

export function EmptyStatePanel({
  title,
  description,
}: EmptyStatePanelProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/75 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
