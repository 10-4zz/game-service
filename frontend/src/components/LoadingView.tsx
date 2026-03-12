export function LoadingView({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
