"use client";

import { useEffect, useState } from "react";

export default function Countdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft) return <div className="text-2xl font-bold animate-pulse text-outline">Calculando...</div>;

  const isExpired = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    return <div className="text-2xl font-bold text-error">Expirado</div>;
  }

  return (
    <div className="flex gap-4">
      <div className="bg-surface p-4 rounded-2xl shadow-sm text-center min-w-[80px] border border-outline-variant/30">
        <span className="text-3xl font-extrabold text-primary">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="block text-xs font-bold text-on-surface-variant uppercase mt-1">Horas</span>
      </div>
      <div className="bg-surface p-4 rounded-2xl shadow-sm text-center min-w-[80px] border border-outline-variant/30">
        <span className="text-3xl font-extrabold text-primary">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="block text-xs font-bold text-on-surface-variant uppercase mt-1">Min</span>
      </div>
      <div className="bg-surface p-4 rounded-2xl shadow-sm text-center min-w-[80px] border border-outline-variant/30">
        <span className="text-3xl font-extrabold text-error">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="block text-xs font-bold text-error uppercase mt-1">Seg</span>
      </div>
    </div>
  );
}
