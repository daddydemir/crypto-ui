import type { ReactNode } from 'react'

export function ChartTooltip({ label, children }: { label?: ReactNode; children: ReactNode }) {
  return <div className="chart-tooltip">
    {label && <div className="chart-tooltip__label">{label}</div>}
    <div className="chart-tooltip__body">{children}</div>
  </div>
}
