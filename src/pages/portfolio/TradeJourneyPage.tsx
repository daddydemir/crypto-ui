import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import { ChevronDown, GitBranch, RefreshCw } from "lucide-react"
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPortfolioTransactions, type PortfolioTransaction } from "@/services/portfolioService"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

interface JourneyTrade extends PortfolioTransaction {
    timestamp: number
    price: number
    quantity: number
    total: number
    balance: number
    averageCost: number | null
    poolQuantity: number
    realizedCostBasis: number | null
    realizedPnl: number | null
    realizedPnlPercent: number | null
    markerSize: number
}

interface TradeSummary {
    trades: JourneyTrade[]
    balance: number
    averageCosts: Array<{ asset: string; value: number }>
    realized: Array<{ asset: string; value: number; percent: number }>
}

const priceOf = (trade: PortfolioTransaction) => {
    const value = trade.transactionType === "BUY" ? trade.spentAmount / trade.receivedAmount : trade.receivedAmount / trade.spentAmount
    return Number.isFinite(value) ? value : 0
}

const buildJourney = (trades: PortfolioTransaction[]): TradeSummary => {
    const pools = new Map<string, { quantity: number; cost: number }>()
    const realized = new Map<string, { value: number; costBasis: number }>()
    let balance = 0

    const journey = trades.map((trade) => {
        const isBuy = trade.transactionType === "BUY"
        const pool = pools.get(trade.quoteAsset) ?? { quantity: 0, cost: 0 }
        const fee = Number(trade.feeAmount) || 0
        const quantity = isBuy ? trade.receivedAmount : trade.spentAmount
        let realizedCostBasis: number | null = null
        let realizedPnl: number | null = null
        let realizedPnlPercent: number | null = null

        if (isBuy) {
            const netQuantity = Math.max(0, trade.receivedAmount - (trade.feeAsset === trade.baseAsset ? fee : 0))
            const cost = trade.spentAmount + (trade.feeAsset === trade.quoteAsset ? fee : 0)
            pool.quantity += netQuantity
            pool.cost += cost
            balance += netQuantity
        } else {
            const soldQuantity = trade.spentAmount + (trade.feeAsset === trade.baseAsset ? fee : 0)
            const proceeds = trade.receivedAmount - (trade.feeAsset === trade.quoteAsset ? fee : 0)
            if (pool.quantity > 0 && soldQuantity > 0 && soldQuantity <= pool.quantity + 1e-10) {
                realizedCostBasis = (pool.cost / pool.quantity) * soldQuantity
                realizedPnl = proceeds - realizedCostBasis
                realizedPnlPercent = realizedCostBasis > 0 ? (realizedPnl / realizedCostBasis) * 100 : null
                pool.quantity = Math.max(0, pool.quantity - soldQuantity)
                pool.cost = Math.max(0, pool.cost - realizedCostBasis)
                const quoteResult = realized.get(trade.quoteAsset) ?? { value: 0, costBasis: 0 }
                quoteResult.value += realizedPnl
                quoteResult.costBasis += realizedCostBasis
                realized.set(trade.quoteAsset, quoteResult)
            }
            balance = Math.max(0, balance - soldQuantity)
        }

        pools.set(trade.quoteAsset, pool)
        return {
            ...trade,
            timestamp: new Date(trade.tradedAt).getTime(),
            price: priceOf(trade),
            quantity,
            total: isBuy ? trade.spentAmount : trade.receivedAmount,
            balance,
            averageCost: pool.quantity > 0 ? pool.cost / pool.quantity : null,
            poolQuantity: pool.quantity,
            realizedCostBasis,
            realizedPnl,
            realizedPnlPercent,
            markerSize: 8,
        }
    })

    const quantities = journey.map((trade) => trade.quantity).filter((value) => value > 0)
    const minQuantity = quantities.length ? Math.min(...quantities) : 0
    const maxQuantity = quantities.length ? Math.max(...quantities) : 0
    journey.forEach((trade) => {
        const ratio = maxQuantity === minQuantity ? 0.5 : (Math.sqrt(Math.max(0, trade.quantity)) - Math.sqrt(minQuantity)) / (Math.sqrt(maxQuantity) - Math.sqrt(minQuantity))
        trade.markerSize = 6 + Math.max(0, Math.min(1, ratio)) * 8
    })

    return {
        trades: journey,
        balance,
        averageCosts: [...pools.entries()]
            .filter(([, pool]) => pool.quantity > 1e-10)
            .map(([asset, pool]) => ({ asset, value: pool.cost / pool.quantity })),
        realized: [...realized.entries()].map(([asset, result]) => ({
            asset,
            value: result.value,
            percent: result.costBasis > 0 ? (result.value / result.costBasis) * 100 : 0,
        })),
    }
}

const numberFormatter = (locale: string, digits: number) => new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
})

const getTradeTimeDomain = (trades: JourneyTrade[]) => {
    const timestamps = trades.map((trade) => trade.timestamp)
    const min = Math.min(...timestamps)
    const max = Math.max(...timestamps)
    const padding = Math.max((max - min) * 0.03, 6 * 60 * 60 * 1000)
    return { start: min - padding, end: max + padding }
}

function TradeMarker({ cx = 0, cy = 0, payload }: { cx?: number; cy?: number; payload?: JourneyTrade }) {
    if (!payload) return null
    const radius = payload.markerSize
    const points = payload.transactionType === "BUY"
        ? `${cx},${cy - radius} ${cx - radius},${cy + radius * 0.72} ${cx + radius},${cy + radius * 0.72}`
        : `${cx - radius},${cy - radius * 0.72} ${cx + radius},${cy - radius * 0.72} ${cx},${cy + radius}`
    return <polygon points={points} fill={payload.transactionType === "BUY" ? "#10b981" : "#f43f5e"} stroke="#ffffff" strokeWidth={2} />
}

function TradeTooltip({ active, payload, locale, t }: { active?: boolean; payload?: ReadonlyArray<{ payload?: JourneyTrade }>; locale: string; t: TFunction }) {
    const trade = payload?.find((item) => item.payload?.transactionType)?.payload
    if (!active || !trade) return null
    const price = numberFormatter(locale, 2)
    const quantity = numberFormatter(locale, 4)
    const pnl = numberFormatter(locale, 2)
    const isBuy = trade.transactionType === "BUY"
    const isProfit = (trade.realizedPnl ?? 0) >= 0

    return <div className="min-w-64 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <p className={`font-bold ${isBuy ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{isBuy ? "▲" : "▼"} {t(isBuy ? "portfolio.buy" : "portfolio.sell")} · {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(trade.tradedAt))}</p>
        <p className="mt-2 font-mono font-semibold text-slate-900 dark:text-white">{quantity.format(trade.quantity)} {trade.baseAsset} @ {price.format(trade.price)} {trade.quoteAsset}</p>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-5 gap-y-2">
            <dt>{t("tradeJourney.totalLabel")}</dt><dd className="font-mono font-semibold">{price.format(trade.total)} {trade.quoteAsset}</dd>
            <dt>{t("tradeJourney.balanceAfter")}</dt><dd className="font-mono font-semibold">{quantity.format(trade.balance)} {trade.baseAsset}</dd>
            {!isBuy && trade.realizedPnl !== null && <><dt>{t("tradeJourney.realizedPnl")}</dt><dd className={`font-mono font-bold ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>{isProfit ? "+" : ""}{pnl.format(trade.realizedPnl)} {trade.quoteAsset} ({isProfit ? "+" : ""}{pnl.format(trade.realizedPnlPercent ?? 0)}%)</dd></>}
        </dl>
    </div>
}

function TradeChart({ trades, locale, t }: { trades: JourneyTrade[]; locale: string; t: TFunction }) {
    const prices = trades.map((trade) => trade.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const pricePadding = Math.max((maxPrice - minPrice) * 0.1, Math.abs(maxPrice || 1) * 0.05, 0.01)
    const timeDomain = getTradeTimeDomain(trades)
    const buys = trades.filter((trade) => trade.transactionType === "BUY")
    const sells = trades.filter((trade) => trade.transactionType === "SELL")
    const price = numberFormatter(locale, 2)

    return <div className="border-t border-slate-200 px-4 py-5 dark:border-slate-800 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">▲ {t("portfolio.buy")}</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">▼ {t("portfolio.sell")}</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-400" />{t("tradeJourney.sizeLegend")}</span>
        </div>
        <div className="h-[340px] w-full sm:h-[390px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trades} margin={{ top: 14, right: 18, bottom: 0, left: 4 }}>
                    <CartesianGrid vertical={false} stroke="#cbd5e1" strokeOpacity={0.45} />
                    <XAxis type="number" dataKey="timestamp" domain={[timeDomain.start, timeDomain.end]} scale="time" tickFormatter={(value) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(value))} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={36} />
                    <YAxis type="number" dataKey="price" domain={[Math.max(0, minPrice - pricePadding), maxPrice + pricePadding]} tickFormatter={(value) => price.format(value)} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={76} />
                    <Tooltip content={<TradeTooltip locale={locale} t={t} />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 4" }} />
                    <Line type="linear" dataKey="price" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 5" dot={false} activeDot={false} isAnimationActive={false} />
                    <Scatter data={buys} dataKey="price" shape={<TradeMarker />} isAnimationActive={false} />
                    <Scatter data={sells} dataKey="price" shape={<TradeMarker />} isAnimationActive={false} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    </div>
}

interface RiverSegment {
    start: number
    end: number
    balance: number
    isCash: boolean
    isOpen: boolean
}

type RiverHover =
    | { type: "segment"; segment: RiverSegment; x: number; y: number }
    | { type: "trade"; trade: JourneyTrade; x: number; y: number }

function BalanceRiver({ trades, locale, t }: { trades: JourneyTrade[]; locale: string; t: TFunction }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(0)
    const [hover, setHover] = useState<RiverHover | null>(null)

    useEffect(() => {
        const element = containerRef.current
        if (!element) return
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const timeDomain = getTradeTimeDomain(trades)
    const domainStart = timeDomain.start
    const domainEnd = timeDomain.end
    const domainLength = Math.max(1, domainEnd - domainStart)
    const maxBalance = Math.max(...trades.map((trade) => trade.balance), 0)
    const dustThreshold = maxBalance * 0.01
    const left = 80
    const right = 18
    const plotWidth = Math.max(1, width - left - right)
    const centerY = 86
    const chartHeight = 184
    const xOf = (timestamp: number) => left + ((timestamp - domainStart) / domainLength) * plotWidth
    const isCashBalance = (balance: number) => maxBalance <= 0 || balance < dustThreshold
    const thicknessOf = (balance: number) => isCashBalance(balance) ? 2 : Math.max(4, (balance / maxBalance) * 30)
    const segments: RiverSegment[] = [
        { start: domainStart, end: trades[0].timestamp, balance: 0, isCash: true, isOpen: false },
        ...trades.map((trade, index) => {
            const isLast = index === trades.length - 1
            return {
                start: trade.timestamp,
                end: isLast ? domainEnd : trades[index + 1].timestamp,
                balance: trade.balance,
                isCash: isCashBalance(trade.balance),
                isOpen: isLast && !isCashBalance(trade.balance),
            }
        }),
    ].filter((segment) => segment.end > segment.start)
    const quantity = numberFormatter(locale, 4)
    const price = numberFormatter(locale, 2)
    const date = (value: number) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    const duration = (start: number, end: number) => {
        const hours = Math.max(0, end - start) / 3_600_000
        return hours < 24 ? t("tradeJourney.hours", { value: numberFormatter(locale, 1).format(hours) }) : t("tradeJourney.days", { value: numberFormatter(locale, 1).format(hours / 24) })
    }
    const tooltipPosition = (event: ReactMouseEvent<SVGElement>) => {
        const bounds = containerRef.current?.getBoundingClientRect()
        if (!bounds) return { x: 0, y: 0 }
        return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    }
    const canShowTradeLabel = (trade: JourneyTrade, index: number) => {
        if (trades.length > 18) return false
        const currentX = xOf(trade.timestamp)
        const previousX = index > 0 ? xOf(trades[index - 1].timestamp) : -Infinity
        return currentX - previousX >= 82
    }

    return <section className="border-t border-slate-200 px-4 py-5 dark:border-slate-800 sm:px-6">
        <div className="mb-3"><h3 className="text-sm font-bold text-slate-900 dark:text-white">{t("tradeJourney.balanceOverTime")}</h3><p className="mt-1 text-xs text-slate-500">{t("tradeJourney.balanceRiverDescription")}</p></div>
        <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-950/20" onMouseLeave={() => setHover(null)}>
            {width > 0 && <svg width={width} height={chartHeight} role="img" aria-label={t("tradeJourney.balanceOverTime")} className="block max-w-full">
                <line x1={left} x2={width - right} y1={centerY} y2={centerY} stroke="#cbd5e1" strokeWidth={1} />
                {segments.map((segment, index) => {
                    const x1 = xOf(segment.start)
                    const x2 = xOf(segment.end)
                    const segmentWidth = Math.max(1, x2 - x1)
                    const thickness = thicknessOf(segment.balance)
                    const label = segment.isCash ? t("tradeJourney.inCash") : `${quantity.format(segment.balance)} ${trades[0].baseAsset}`
                    return <g key={`${segment.start}-${index}`} onMouseEnter={(event) => setHover({ type: "segment", segment, ...tooltipPosition(event) })} onMouseMove={(event) => setHover({ type: "segment", segment, ...tooltipPosition(event) })}>
                        <rect x={x1} y={centerY - thickness / 2} width={segmentWidth} height={thickness} fill={segment.isCash ? "#94a3b8" : "#6366f1"} fillOpacity={segment.isOpen ? 0.28 : segment.isCash ? 0.75 : 0.82} stroke={segment.isOpen ? "#6366f1" : "none"} strokeWidth={segment.isOpen ? 1 : 0} strokeDasharray={segment.isOpen ? "4 4" : undefined} />
                        {index > 0 && !segment.isCash && <line x1={x1} x2={x1} y1={centerY - thickness / 2} y2={centerY + thickness / 2} stroke="#4f46e5" strokeWidth={1} />}
                        {segmentWidth >= 118 && <text x={x1 + segmentWidth / 2} y={centerY + thickness / 2 + 22} textAnchor="middle" fill="#64748b" fontSize={12}>{label} · {duration(segment.start, segment.end)}</text>}
                    </g>
                })}
                {trades.map((trade, index) => {
                    const x = xOf(trade.timestamp)
                    const isBuy = trade.transactionType === "BUY"
                    const markerY = centerY
                    const showLabel = canShowTradeLabel(trade, index)
                    const labelY = index % 2 === 0 ? 27 : 45
                    const points = isBuy ? `${x},${markerY - 8} ${x - 7},${markerY + 5} ${x + 7},${markerY + 5}` : `${x - 7},${markerY - 5} ${x + 7},${markerY - 5} ${x},${markerY + 8}`
                    return <g key={trade.id} className="cursor-pointer" onMouseEnter={(event) => setHover({ type: "trade", trade, ...tooltipPosition(event) })} onMouseMove={(event) => setHover({ type: "trade", trade, ...tooltipPosition(event) })}>
                        {showLabel && <><line x1={x} x2={x} y1={labelY + 5} y2={markerY - 11} stroke="#cbd5e1" strokeWidth={1} /><text x={x} y={labelY} textAnchor="middle" fill={isBuy ? "#059669" : "#e11d48"} fontSize={12} fontWeight={600}>{t(isBuy ? "portfolio.buy" : "portfolio.sell")} {price.format(trade.price)}</text></>}
                        <polygon points={points} fill={isBuy ? "#10b981" : "#f43f5e"} stroke="#ffffff" strokeWidth={2} />
                    </g>
                })}
                <text x={left} y={chartHeight - 12} fill="#94a3b8" fontSize={12}>{new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(domainStart))}</text>
                <text x={width - right} y={chartHeight - 12} textAnchor="end" fill="#94a3b8" fontSize={12}>{new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(domainEnd))}</text>
            </svg>}
            {hover && <div className="pointer-events-none absolute z-20 min-w-64 max-w-80 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" style={{ left: Math.max(8, Math.min(hover.x + 12, width - 328)), top: Math.max(8, Math.min(hover.y + 12, chartHeight - 132)) }}>
                {hover.type === "segment" ? <><p className="font-bold text-slate-900 dark:text-white">{hover.segment.isCash ? t("tradeJourney.inCash") : t("tradeJourney.assetBalance")}</p><dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5"><dt>{t("tradeJourney.period")}</dt><dd className="text-right">{date(hover.segment.start)} – {date(hover.segment.end)}</dd><dt>{t("tradeJourney.balance")}</dt><dd className="text-right font-mono">{hover.segment.isCash ? "—" : `${quantity.format(hover.segment.balance)} ${trades[0].baseAsset}`}</dd><dt>{t("tradeJourney.duration")}</dt><dd className="text-right">{duration(hover.segment.start, hover.segment.end)}</dd>{hover.segment.isOpen && <><dt>{t("tradeJourney.status")}</dt><dd className="text-right font-semibold text-indigo-600">{t("tradeJourney.openPosition")}</dd></>}</dl></> : <><div className="flex items-center justify-between gap-3"><span className={`font-bold ${hover.trade.transactionType === "BUY" ? "text-emerald-600" : "text-rose-600"}`}>{hover.trade.transactionType === "BUY" ? "▲" : "▼"} {t(hover.trade.transactionType === "BUY" ? "portfolio.buy" : "portfolio.sell")}</span><time>{date(hover.trade.timestamp)}</time></div><dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5"><dt>{t("tradeJourney.trade")}</dt><dd className="text-right font-mono">{quantity.format(hover.trade.quantity)} {hover.trade.baseAsset} @ {price.format(hover.trade.price)} {hover.trade.quoteAsset}</dd><dt>{t("tradeJourney.totalLabel")}</dt><dd className="text-right font-mono">{price.format(hover.trade.total)} {hover.trade.quoteAsset}</dd>{hover.trade.realizedPnl !== null && <><dt>{t("tradeJourney.realizedPnl")}</dt><dd className={`text-right font-mono font-bold ${hover.trade.realizedPnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{hover.trade.realizedPnl >= 0 ? "+" : ""}{price.format(hover.trade.realizedPnl)} {hover.trade.quoteAsset}</dd></>}</dl></>}
            </div>}
        </div>
    </section>
}

function TradeTable({ trades, locale, t }: { trades: JourneyTrade[]; locale: string; t: TFunction }) {
    const price = numberFormatter(locale, 2)
    const quantity = numberFormatter(locale, 4)
    const pnl = numberFormatter(locale, 2)
    return <details className="group border-t border-slate-200 dark:border-slate-800">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/50">{t("tradeJourney.allTrades")}<span className="flex items-center gap-2 text-xs font-normal text-slate-500">{t("tradeJourney.tradeCount", { count: trades.length })}<ChevronDown size={17} className="transition-transform group-open:rotate-180" /></span></summary>
        <div className="max-h-[480px] overflow-auto border-t border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400"><tr>{["date", "direction", "amount", "unitPrice", "totalLabel", "balanceAfter", "realizedPnl"].map((key) => <th key={key} className="whitespace-nowrap px-4 py-3 font-semibold">{t(`tradeJourney.${key}`)}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{trades.map((trade) => {
                    const isBuy = trade.transactionType === "BUY"
                    const isProfit = (trade.realizedPnl ?? 0) >= 0
                    return <tr key={trade.id} className="text-slate-600 hover:bg-slate-50/70 dark:text-slate-300 dark:hover:bg-slate-800/30">
                        <td className="whitespace-nowrap px-4 py-3">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(trade.tradedAt))}</td>
                        <td className={`px-4 py-3 font-bold ${isBuy ? "text-emerald-600" : "text-rose-600"}`}>{isBuy ? "▲" : "▼"} {t(isBuy ? "portfolio.buy" : "portfolio.sell")}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono">{quantity.format(trade.quantity)} {trade.baseAsset}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono">{price.format(trade.price)} {trade.quoteAsset}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono">{price.format(trade.total)} {trade.quoteAsset}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono">{quantity.format(trade.balance)} {trade.baseAsset}</td>
                        <td className={`whitespace-nowrap px-4 py-3 font-mono font-semibold ${trade.realizedPnl === null ? "text-slate-400" : isProfit ? "text-emerald-600" : "text-rose-600"}`}>{trade.realizedPnl === null ? "—" : `${isProfit ? "+" : ""}${pnl.format(trade.realizedPnl)} ${trade.quoteAsset} (${isProfit ? "+" : ""}${pnl.format(trade.realizedPnlPercent ?? 0)}%)`}</td>
                    </tr>
                })}</tbody>
            </table>
        </div>
    </details>
}

function SummaryCards({ summary, symbol, buys, sells, locale, t }: { summary: TradeSummary; symbol: string; buys: number; sells: number; locale: string; t: TFunction }) {
    const price = numberFormatter(locale, 2)
    const quantity = numberFormatter(locale, 4)
    const totalPnl = summary.realized.reduce((total, item) => total + item.value, 0)
    const hasLoss = totalPnl < 0
    return <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><p className="text-xs font-semibold text-slate-500">{t("tradeJourney.realizedPnl")}</p><div className="mt-2 space-y-1">{summary.realized.length ? summary.realized.map(item => <p key={item.asset} className={`text-lg font-bold ${item.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{item.value >= 0 ? "+" : ""}{price.format(item.value)} {item.asset} <span className="text-xs">({item.percent >= 0 ? "+" : ""}{price.format(item.percent)}%)</span></p>) : <p className={`text-lg font-bold ${hasLoss ? "text-rose-600" : "text-slate-400"}`}>—</p>}</div></div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><p className="text-xs font-semibold text-slate-500">{t("tradeJourney.currentBalance")}</p><p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{quantity.format(summary.balance)} {symbol}</p><p className="mt-1 text-xs text-slate-500">{t("tradeJourney.averageCost")}: {summary.averageCosts.length ? summary.averageCosts.map(item => `${price.format(item.value)} ${item.asset}`).join(" · ") : "—"}</p></div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><p className="text-xs font-semibold text-slate-500">{t("tradeJourney.transactionCount")}</p><p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{summary.trades.length}</p><p className="mt-1 text-xs text-slate-500"><span className="font-semibold text-emerald-600">{buys} {t("portfolio.buy")}</span> · <span className="font-semibold text-rose-600">{sells} {t("portfolio.sell")}</span></p></div>
    </div>
}

export default function TradeJourneyPage() {
    const { t, i18n } = useTranslation()
    const [transactions, setTransactions] = useState<PortfolioTransaction[]>([])
    const [platform, setPlatform] = useState("")
    const [coin, setCoin] = useState("ALL")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const load = useCallback(async () => { setLoading(true); setError(""); try { setTransactions(await getPortfolioTransactions()) } catch (reason) { setError(reason instanceof Error ? reason.message : t("tradeJourney.loadError")) } finally { setLoading(false) } }, [t])
    useEffect(() => { void load() }, [load])

    const platforms = useMemo(() => [...new Set(transactions.map(item => item.platform).filter(Boolean))].sort(), [transactions])
    useEffect(() => { if (!platform && platforms.length) setPlatform(platforms[0]) }, [platform, platforms])
    const platformTrades = useMemo(() => transactions.filter(item => item.platform === platform), [platform, transactions])
    const coins = useMemo(() => [...new Set(platformTrades.map(item => item.baseAsset))].sort(), [platformTrades])
    useEffect(() => { if (coin !== "ALL" && !coins.includes(coin)) setCoin("ALL") }, [coin, coins])
    const groups = useMemo(() => coins.filter(symbol => coin === "ALL" || coin === symbol).map(symbol => ({ symbol, summary: buildJourney(platformTrades.filter(item => item.baseAsset === symbol).sort((a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime())) })), [coin, coins, platformTrades])
    const locale = i18n.language === "tr" ? "tr-TR" : "en-US"

    return <div className="page-shell">
        <section className="page-hero"><div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10"><GitBranch size={24}/></span><h1 className="text-3xl font-bold tracking-tight">{t("tradeJourney.title")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t("tradeJourney.description")}</p></div><button onClick={() => void load()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/>{t("tradeJourney.refresh")}</button></div></section>
        <section className="surface-card grid gap-4 p-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{t("tradeJourney.platform")}<Select value={platform} onValueChange={setPlatform}><SelectTrigger className="h-11 w-full"><SelectValue placeholder={t("tradeJourney.selectPlatform")}/></SelectTrigger><SelectContent searchPlaceholder={t("tradeJourney.searchPlatform")}>{platforms.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label><label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{t("tradeJourney.coin")}<Select value={coin} onValueChange={setCoin}><SelectTrigger className="h-11 w-full"><SelectValue/></SelectTrigger><SelectContent searchPlaceholder={t("tradeJourney.searchCoin")}><SelectItem value="ALL">{t("tradeJourney.allCoins")}</SelectItem>{coins.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label></section>
        {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</div> : loading ? <div className="surface-card flex min-h-64 items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 animate-spin" size={18}/>{t("tradeJourney.loading")}</div> : groups.length === 0 ? <div className="surface-card flex min-h-64 flex-col items-center justify-center px-6 text-center"><GitBranch size={30} className="mb-3 text-slate-300"/><p className="font-semibold text-slate-800 dark:text-white">{t("tradeJourney.empty")}</p><p className="mt-1 text-sm text-slate-500">{t("tradeJourney.emptyDescription")}</p></div> : groups.map(({ symbol, summary }) => {
            const buys = summary.trades.filter(trade => trade.transactionType === "BUY").length
            const sells = summary.trades.length - buys
            return <section key={symbol} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">{symbol.slice(0, 2)}</span><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">{symbol}</h2><p className="text-xs text-slate-500">{t("tradeJourney.tradeCount", { count: summary.trades.length })}</p></div></div><span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">{platform}</span></header>
                <SummaryCards summary={summary} symbol={symbol} buys={buys} sells={sells} locale={locale} t={t} />
                <TradeChart trades={summary.trades} locale={locale} t={t} />
                <BalanceRiver trades={summary.trades} locale={locale} t={t} />
                <TradeTable trades={summary.trades} locale={locale} t={t} />
            </section>
        })}
    </div>
}
