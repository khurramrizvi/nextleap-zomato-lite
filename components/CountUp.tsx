"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  value: number;
  durationMs?: number;
  delayMs?: number;
}

/**
 * Counts from 0 up to `value`, decelerating into the final number.
 * Shows the final value straight away when reduced motion is requested.
 */
export function CountUp({ value, durationMs = 1100, delayMs = 0 }: CountUpProps) {
  const [display, setDisplay] = useState<string>("0.0");

  useEffect(() => {
    const final = String(value);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(final);
      return;
    }

    let frame = 0;
    const start = performance.now() + delayMs;

    function tick(now: number) {
      const t = Math.min(1, Math.max(0, (now - start) / durationMs));
      const eased = 1 - Math.pow(1 - t, 4);
      if (t < 1) {
        setDisplay((value * eased).toFixed(1));
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(final);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, delayMs]);

  return (
    <>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}
