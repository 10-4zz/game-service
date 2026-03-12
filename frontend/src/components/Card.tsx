import type { PropsWithChildren, ReactNode } from 'react';

interface CardProps extends PropsWithChildren {
  title?: string;
  extra?: ReactNode;
  className?: string;
}

export function Card({ title, extra, children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-white/70 bg-white/90 p-5 shadow-panel backdrop-blur ${className}`}
    >
      {(title || extra) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? <h2 className="text-lg font-semibold text-ink">{title}</h2> : <div />}
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}
