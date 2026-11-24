import { formatPence, formatPenceExact } from "@/lib/money";

/**
 * 30-day revenue bar chart (single series → no legend; the card title names it).
 * Thin bars with 4px rounded tops anchored to the baseline, 2px gaps, recessive grid,
 * per-bar hover tooltip, and a visually hidden table for screen readers.
 */
export function SalesChart({ days }: { days: { date: string; totalPence: number; orders: number }[] }) {
  const max = Math.max(...days.map((d) => d.totalPence), 1);
  const nice = niceMax(max);
  const W = 720;
  const H = 220;
  const pad = { l: 48, r: 8, t: 12, b: 24 };
  const bw = (W - pad.l - pad.r) / days.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / nice);
  const fmtDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  return (
    <figure>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Daily revenue for the last 30 days">
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={W - pad.r} y1={y(nice * f)} y2={y(nice * f)} stroke="#E9DBC4" strokeWidth="1" />
              <text x={pad.l - 6} y={y(nice * f) + 4} textAnchor="end" fontSize="10" fill="#6B5444">
                {formatPence(Math.round(nice * f))}
              </text>
            </g>
          ))}
          {days.map((d, i) => {
            const h = H - pad.b - y(d.totalPence);
            const x = pad.l + i * bw + 1;
            const w = Math.max(2, bw - 2);
            return (
              <g key={d.date} className="group">
                <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
                {d.totalPence > 0 && (
                  <path d={roundedTop(x, y(d.totalPence), w, h)} fill="#A84A2A" className="transition-opacity group-hover:opacity-80" />
                )}
                <title>{`${fmtDay.format(new Date(d.date))}: ${formatPenceExact(d.totalPence)} from ${d.orders} order${d.orders === 1 ? "" : "s"}`}</title>
                {i % 7 === 0 && (
                  <text x={x + w / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#6B5444">
                    {fmtDay.format(new Date(d.date))}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="#D9C3A1" />
        </svg>
      </div>
      <table className="sr-only">
        <caption>Daily revenue, last 30 days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{formatPenceExact(d.totalPence)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function niceMax(v: number) {
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / pow) * pow;
}

function roundedTop(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}
