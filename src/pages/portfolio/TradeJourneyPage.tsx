import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, GitBranch, RefreshCw, TrendingDown, TrendingUp, WalletCards } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPortfolioTransactions, type PortfolioTransaction } from "@/services/portfolioService"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

interface JourneyTrade extends PortfolioTransaction {
    balance: number
    realizedPnl: number | null
    realizedPnlPercent: number | null
}

const priceOf = (trade: PortfolioTransaction) => {
    const value = trade.transactionType === "BUY" ? trade.spentAmount / trade.receivedAmount : trade.receivedAmount / trade.spentAmount
    return Number.isFinite(value) ? value : 0
}

const buildJourney = (trades: PortfolioTransaction[]): JourneyTrade[] => {
    const pools = new Map<string, { quantity: number; cost: number }>()
    let balance = 0

    return trades.map((trade) => {
        const isBuy = trade.transactionType === "BUY"
        const pool = pools.get(trade.quoteAsset) ?? { quantity: 0, cost: 0 }
        const fee = Number(trade.feeAmount) || 0
        let realizedPnl: number | null = null
        let realizedPnlPercent: number | null = null

        if (isBuy) {
            const quantity = Math.max(0, trade.receivedAmount - (trade.feeAsset === trade.baseAsset ? fee : 0))
            const cost = trade.spentAmount + (trade.feeAsset === trade.quoteAsset ? fee : 0)
            pool.quantity += quantity
            pool.cost += cost
            balance += quantity
        } else {
            const quantity = trade.spentAmount + (trade.feeAsset === trade.baseAsset ? fee : 0)
            const proceeds = trade.receivedAmount - (trade.feeAsset === trade.quoteAsset ? fee : 0)
            if (pool.quantity > 0 && quantity > 0 && quantity <= pool.quantity + 1e-10) {
                const costBasis = (pool.cost / pool.quantity) * quantity
                realizedPnl = proceeds - costBasis
                realizedPnlPercent = costBasis > 0 ? (realizedPnl / costBasis) * 100 : null
                pool.quantity = Math.max(0, pool.quantity - quantity)
                pool.cost = Math.max(0, pool.cost - costBasis)
            }
            balance = Math.max(0, balance - quantity)
        }

        pools.set(trade.quoteAsset, pool)
        return { ...trade, balance, realizedPnl, realizedPnlPercent }
    })
}

function TradeNode({ trade, index, locale, t }: { trade: JourneyTrade; index: number; locale: string; t: TFunction }) {
    const isBuy = trade.transactionType === "BUY"
    const isProfit = (trade.realizedPnl ?? 0) >= 0
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 8 })
    const date = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(trade.tradedAt))

    return <div className="group relative grid grid-cols-[64px_minmax(0,1fr)] pb-7 last:pb-0 sm:grid-cols-[84px_minmax(0,1fr)]">
        <div className="relative flex justify-center">
            <span className="absolute bottom-0 top-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-slate-200 dark:bg-slate-800 group-last:bottom-auto group-last:h-8" />
            <span className={`z-10 mt-4 flex h-10 w-10 items-center justify-center rounded-full border-[5px] border-white text-xs font-black text-white shadow-lg dark:border-slate-950 ${isBuy ? "bg-emerald-500 shadow-emerald-500/25" : "bg-rose-500 shadow-rose-500/25"}`}>{index + 1}</span>
            <span className={`absolute left-1/2 top-8 h-8 w-[calc(50%-4px)] border-t-2 border-r-2 sm:w-[calc(50%+6px)] ${isBuy ? "rounded-tr-2xl border-emerald-300 dark:border-emerald-800" : "rounded-tr-2xl border-rose-300 dark:border-rose-800"}`} />
        </div>

        <article className={`relative ml-2 overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900 sm:ml-3 ${isBuy ? "border-emerald-200/80 dark:border-emerald-900" : "border-rose-200/80 dark:border-rose-900"}`}>
            <div className={`absolute inset-y-0 left-0 w-1 ${isBuy ? "bg-emerald-500" : "bg-rose-500"}`} />
            <div className="p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className={`flex items-center gap-2 text-sm font-extrabold ${isBuy ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isBuy ? "bg-emerald-50 dark:bg-emerald-950/60" : "bg-rose-50 dark:bg-rose-950/60"}`}>{isBuy ? <ArrowDownLeft size={17}/> : <ArrowUpRight size={17}/>}</span>{t(isBuy ? "portfolio.buy" : "portfolio.sell")}</div>
                    <time className="text-xs font-medium text-slate-500">{date}</time>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("tradeJourney.amount")}</p><p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">{formatter.format(isBuy ? trade.receivedAmount : trade.spentAmount)} {trade.baseAsset}</p></div>
                    <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("tradeJourney.unitPrice")}</p><p className="mt-1 font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{formatter.format(priceOf(trade))} {trade.quoteAsset}</p></div>
                    <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("tradeJourney.totalLabel")}</p><p className="mt-1 font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{formatter.format(isBuy ? trade.spentAmount : trade.receivedAmount)} {trade.quoteAsset}</p></div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><WalletCards size={14}/>{t("tradeJourney.balanceAfter")}: {formatter.format(trade.balance)} {trade.baseAsset}</span>
                    {!isBuy && trade.realizedPnl !== null && <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${isProfit ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"}`}>{isProfit ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}{t("tradeJourney.realizedPnl")}: {isProfit ? "+" : ""}{formatter.format(trade.realizedPnl)} {trade.quoteAsset} ({isProfit ? "+" : ""}{(trade.realizedPnlPercent ?? 0).toFixed(2)}%)</span>}
                    {!isBuy && trade.realizedPnl === null && <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{t("tradeJourney.pnlUnavailable")}</span>}
                </div>
            </div>
        </article>
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
    const groups = useMemo(() => coins.filter(symbol => coin === "ALL" || coin === symbol).map(symbol => ({ symbol, trades: buildJourney(platformTrades.filter(item => item.baseAsset === symbol).sort((a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime())) })), [coin, coins, platformTrades])
    const locale = i18n.language === "tr" ? "tr-TR" : "en-US"

    return <div className="page-shell">
        <section className="page-hero"><div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10"><GitBranch size={24}/></span><h1 className="text-3xl font-bold tracking-tight">{t("tradeJourney.title")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t("tradeJourney.description")}</p></div><button onClick={() => void load()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/>{t("tradeJourney.refresh")}</button></div></section>
        <section className="surface-card grid gap-4 p-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{t("tradeJourney.platform")}<Select value={platform} onValueChange={setPlatform}><SelectTrigger className="h-11 w-full"><SelectValue placeholder={t("tradeJourney.selectPlatform")}/></SelectTrigger><SelectContent searchPlaceholder={t("tradeJourney.searchPlatform")}>{platforms.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label><label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{t("tradeJourney.coin")}<Select value={coin} onValueChange={setCoin}><SelectTrigger className="h-11 w-full"><SelectValue/></SelectTrigger><SelectContent searchPlaceholder={t("tradeJourney.searchCoin")}><SelectItem value="ALL">{t("tradeJourney.allCoins")}</SelectItem>{coins.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label></section>
        {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</div> : loading ? <div className="surface-card flex min-h-64 items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 animate-spin" size={18}/>{t("tradeJourney.loading")}</div> : groups.length === 0 ? <div className="surface-card flex min-h-64 flex-col items-center justify-center px-6 text-center"><GitBranch size={30} className="mb-3 text-slate-300"/><p className="font-semibold text-slate-800 dark:text-white">{t("tradeJourney.empty")}</p><p className="mt-1 text-sm text-slate-500">{t("tradeJourney.emptyDescription")}</p></div> : groups.map(group => {
            const buys = group.trades.filter(trade => trade.transactionType === "BUY").length
            const sells = group.trades.length - buys
            return <section key={group.symbol} className="surface-card overflow-hidden"><header className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white shadow-md shadow-indigo-500/20">{group.symbol.slice(0, 2)}</span><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">{group.symbol}</h2><p className="text-xs text-slate-500">{t("tradeJourney.tradeCount", { count: group.trades.length })}</p></div></div><div className="flex flex-wrap gap-2"><span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{buys} {t("portfolio.buy")}</span><span className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{sells} {t("portfolio.sell")}</span><span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">{platform}</span></div></header><div className="px-3 py-6 sm:px-8">{group.trades.map((trade, index) => <TradeNode key={trade.id} trade={trade} index={index} locale={locale} t={t}/>)}</div></section>
        })}
    </div>
}
