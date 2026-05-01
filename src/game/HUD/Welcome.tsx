'use client';

import { useEffect, useState } from 'react';

type Props = { message: string | null };

export function Welcome({ message }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (message) {
      setOpen(true);
      const t = setTimeout(() => setOpen(false), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);
  if (!open || !message) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center">
      <div className="rounded-2xl bg-white/90 px-5 py-3 text-center shadow-xl backdrop-blur">
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
