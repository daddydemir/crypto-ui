import { useCallback, useEffect, useMemo, useState } from "react"
import { Coins, Eye, EyeOff, Layers3, RefreshCw, WalletCards } from "lucide-react"
import { useTranslation } from "react-i18next"
import { getPortfolioTransactions, type PortfolioTransaction } from "@/services/portfolioService"
import { useCryptoWebSocket } from "@/hooks/useCryptoWebSocket"
import { useAuth } from "@/contexts/AuthContext"
import { calculateActivePositions } from "./portfolioPositions"

const USD_QUOTES = new Set(["USD", "USDT", "USDC"])

function readHiddenPositions(storageKey: string) {
    try {
        const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]")
        return new Set<string>(Array.isArray(stored) ? stored.filter(value => typeof value === "string") : [])
    } catch {
        return new Set<string>()
    }
}

export default function ActiveAssetsPage() {
    const { t, i18n } = useTranslation()
    const { username } = useAuth()
    const hiddenStorageKey = `portfolio:hidden-positions:${username ?? "anonymous"}`
    const locale = i18n.language === "tr" ? "tr-TR" : "en-US"
    const number = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }), [locale])
    const money = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), [locale])
    const livePriceNumber = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 8 }), [locale])
    const livePrices = useCryptoWebSocket()
    const [transactions, setTransactions] = useState<PortfolioTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [hiddenPositions, setHiddenPositions] = useState<Set<string>>(() => readHiddenPositions(hiddenStorageKey))
    const [showHidden, setShowHidden] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            setTransactions(await getPortfolioTransactions())
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t("activeHoldings.loadError"))
        } finally {
            setLoading(false)
        }
    }, [t])

    useEffect(() => { void load() }, [load])
    useEffect(() => { setHiddenPositions(readHiddenPositions(hiddenStorageKey)) }, [hiddenStorageKey])

    const positions = useMemo(() => calculateActivePositions(transactions), [transactions])
    const assetCount = new Set(positions.map(position => position.baseAsset)).size
    const visiblePositions = showHidden ? positions : positions.filter(position => !hiddenPositions.has(`${position.baseAsset}/${position.quoteAsset}`))
    const hiddenCount = positions.filter(position => hiddenPositions.has(`${position.baseAsset}/${position.quoteAsset}`)).length

    const setPositionHidden = (positionKey: string, hidden: boolean) => {
        setHiddenPositions(current => {
            const next = new Set(current)
            if (hidden) next.add(positionKey)
            else next.delete(positionKey)
            localStorage.setItem(hiddenStorageKey, JSON.stringify([...next]))
            return next
        })
    }

    return (
        <div className="mx-auto max-w-[1500px] space-y-7">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-7 text-white shadow-xl sm:px-8">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10"><Coins size={24} /></div><h1 className="text-3xl font-bold tracking-tight">{t("activeHoldings.title")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t("activeHoldings.description")}</p></div>
                    <button onClick={() => void load()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/20 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""} />{t("activeHoldings.refresh")}</button>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-gray-500">{t("activeHoldings.assets")}</p><p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{assetCount}</p><p className="mt-1 text-xs text-gray-400">{t("activeHoldings.assetsDetail")}</p></div><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50"><Coins size={20} /></span></div></div>
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-gray-500">{t("activeHoldings.positions")}</p><p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{positions.length}</p><p className="mt-1 text-xs text-gray-400">{t("activeHoldings.positionsDetail")}</p></div><span className="rounded-xl bg-sky-50 p-2.5 text-sky-600 dark:bg-sky-950/50"><Layers3 size={20} /></span></div></div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                {!error && !loading && positions.length > 0 && <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="font-bold text-gray-950 dark:text-white">{t("activeHoldings.positionList")}</h2><p className="mt-0.5 text-xs text-gray-500">{t("activeHoldings.hiddenCount", { count: hiddenCount })}</p></div><button type="button" onClick={() => setShowHidden(current => !current)} disabled={hiddenCount === 0} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{showHidden ? <EyeOff size={16} /> : <Eye size={16} />}{t(showHidden ? "activeHoldings.hideHidden" : "activeHoldings.showHidden")}</button></div>}
                {error ? <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</div> : loading ? <div className="flex min-h-64 items-center justify-center text-sm text-gray-500"><RefreshCw className="mr-2 animate-spin" size={18} />{t("activeHoldings.loading")}</div> : positions.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="mb-4 rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-950/50"><WalletCards size={30} /></div><h2 className="font-bold text-gray-900 dark:text-white">{t("activeHoldings.empty")}</h2><p className="mt-1 max-w-md text-sm text-gray-500">{t("activeHoldings.emptyDescription")}</p></div> : visiblePositions.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><EyeOff className="mb-3 text-gray-400" size={30} /><h2 className="font-bold text-gray-900 dark:text-white">{t("activeHoldings.allHidden")}</h2><button type="button" onClick={() => setShowHidden(true)} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{t("activeHoldings.showHidden")}</button></div> : (
                    <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left"><thead><tr className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:bg-gray-800/40"><th className="px-6 py-3.5">{t("activeHoldings.asset")}</th><th className="px-5 py-3.5">{t("activeHoldings.costCurrency")}</th><th className="px-5 py-3.5 text-right">{t("activeHoldings.quantity")}</th><th className="px-5 py-3.5 text-right">{t("activeHoldings.averageCost")}</th><th className="px-5 py-3.5 text-right">{t("activeHoldings.costBasis")}</th><th className="px-5 py-3.5 text-right">{t("activeHoldings.profitLoss")}</th><th className="px-5 py-3.5">{t("activeHoldings.platforms")}</th><th className="w-28 px-5 py-3.5" /></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{visiblePositions.map(position => {
                        const positionKey = `${position.baseAsset}/${position.quoteAsset}`
                        const isHidden = hiddenPositions.has(positionKey)
                        const livePrice = livePrices[position.baseAsset]
                        const canCalculateProfitLoss = USD_QUOTES.has(position.quoteAsset) && livePrice !== undefined
                        const currentValue = canCalculateProfitLoss ? position.quantity * livePrice : 0
                        const profitLoss = currentValue - position.costBasis
                        const profitLossPercent = position.costBasis > 0 ? (profitLoss / position.costBasis) * 100 : 0
                        return <tr key={positionKey} className={`transition hover:bg-gray-50/70 dark:hover:bg-gray-800/30 ${isHidden ? "opacity-50" : ""}`}><td className="px-6 py-4"><p className="font-bold text-gray-950 dark:text-white">{position.baseAsset}</p><p className="mt-0.5 text-xs text-gray-400">{t("activeHoldings.buyCount", { count: position.buyCount })}</p></td><td className="px-5 py-4"><span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">{position.quoteAsset}</span></td><td className="px-5 py-4 text-right"><p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">{number.format(position.quantity)} {position.baseAsset}</p><p className="mt-1 text-xs font-medium text-sky-600 dark:text-sky-400">{livePrice !== undefined ? t("activeHoldings.livePrice", { price: livePriceNumber.format(livePrice) }) : t("activeHoldings.waitingForPrice")}</p></td><td className="px-5 py-4 text-right font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">{money.format(position.averageCost)} {position.quoteAsset}</td><td className="px-5 py-4 text-right font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">{money.format(position.costBasis)} {position.quoteAsset}</td><td className="px-5 py-4 text-right">{canCalculateProfitLoss ? <><p className={`font-mono text-sm font-bold ${profitLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{profitLoss >= 0 ? "+" : "−"}${money.format(Math.abs(profitLoss))}</p><p className={`mt-1 text-xs font-semibold ${profitLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{profitLoss >= 0 ? "+" : "−"}{money.format(Math.abs(profitLossPercent))}%</p></> : <span className="text-sm text-gray-400">—</span>}</td><td className="px-5 py-4 text-sm text-gray-500">{position.platforms.join(", ")}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setPositionHidden(positionKey, !isHidden)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{isHidden ? <Eye size={14} /> : <EyeOff size={14} />}{t(isHidden ? "activeHoldings.restore" : "activeHoldings.hide")}</button></td></tr>
                    })}</tbody></table></div>
                )}
            </section>
        </div>
    )
}
