import type { CSSProperties } from "react";

/**
 * Odometer-style number: each digit rolls up into place.
 * Pure CSS transforms, so it runs on the compositor and stays smooth on
 * phones. The final digit sits in normal flow, which keeps the width fixed
 * for the whole animation (no layout shift while it rolls).
 */
export function RollingNumber({ value }: { value: number }) {
  const chars = String(value).split("");
  let digitIndex = 0;

  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((char, index) => {
          if (!/\d/.test(char)) {
            return <span key={index}>{char}</span>;
          }
          const digit = Number(char);
          const order = digitIndex++;
          // Later digits spin through an extra 0-9 lap for the odometer feel.
          const strip = [
            ...Array.from({ length: order * 10 }, (_, n) => n % 10),
            ...Array.from({ length: digit + 1 }, (_, n) => n),
          ];
          return (
            <span key={index} className="roll-digit">
              <span className="invisible">{digit}</span>
              <span
                className="roll-strip"
                style={
                  { "--steps": strip.length - 1, "--i": order } as CSSProperties
                }
              >
                {strip.map((n, stripIndex) => (
                  <span key={stripIndex}>{n}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}
