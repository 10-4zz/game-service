import type { PropsWithChildren, ReactNode } from 'react';

interface CardProps extends PropsWithChildren {
  title?: string;
  extra?: ReactNode;
  className?: string;
}

export function Card({ title, extra, children, className = '' }: CardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[26px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.98)_100%)] p-5 text-slate-800 shadow-panel ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.14),transparent_45%)]" />
      {(title || extra) && (
        <div className="relative mb-4 flex items-center justify-between gap-4">
          {title ? (
            <div>
              <div className="mb-2 h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
            </div>
          ) : (
            <div />
          )}
          {extra}
        </div>
      )}
      <div className="relative">{children}</div>
    </section>
  );
}
