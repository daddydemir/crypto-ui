import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Building2, Coins, Download, MoreHorizontal, Pencil, Plus, RefreshCw, Trash2, WalletCards } from "lucide-react"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import ExchangeImportDialog from "@/components/portfolio/ExchangeImportDialog"
import TransactionDialog from "@/components/portfolio/TransactionDialog"
import { createPortfolioTransaction, deletePortfolioTransaction, getPortfolioTransactions, updatePortfolioTransaction, type PortfolioTransaction, type PortfolioTransactionInput } from "@/services/portfolioService"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export default function PortfolioPage() {
    const { t, i18n } = useTranslation()
    const locale = i18n.language === "tr" ? "tr-TR" : "en-US"
    const money = new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 8 })
    const date = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    const [transactions, setTransactions] = useState<PortfolioTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [importOpen, setImportOpen] = useState(false)
    const [editing, setEditing] = useState<PortfolioTransaction | null>(null)
    const [deleting, setDeleting] = useState<PortfolioTransaction | null>(null)
    const [menu, setMenu] = useState<number | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            setTransactions(await getPortfolioTransactions())
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t("portfolio.loadError"))
        } finally {
            setLoading(false)
        }
    }, [t])

    useEffect(() => { void load() }, [load])

    const summary = useMemo(() => {
        const holdings = new Map<string, number>()
        let buyVolume = 0
        let sellVolume = 0
        const platforms = new Set<string>()
        transactions.forEach(item => {
            holdings.set(item.receivedAsset, (holdings.get(item.receivedAsset) ?? 0) + item.receivedAmount)
            holdings.set(item.spentAsset, (holdings.get(item.spentAsset) ?? 0) - item.spentAmount)
            if (item.transactionType === "BUY") buyVolume += item.usdValue
            else sellVolume += item.usdValue
            platforms.add(item.platform)
        })
        return {
            activeAssets: [...holdings.entries()].filter(([asset, value]) => !["USD", "USDT", "USDC", "TRY"].includes(asset) && value > 0).length,
            buyVolume,
            netInvested: buyVolume - sellVolume,
            platforms: platforms.size,
        }
    }, [transactions])

    const save = async (input: PortfolioTransactionInput) => {
        if (editing) await updatePortfolioTransaction(editing.id, input)
        else await createPortfolioTransaction(input)
        await load()
    }

    const remove = async () => {
        if (!deleting) return
        await deletePortfolioTransaction(deleting.id)
        setDeleting(null)
        await load()
    }

    const openCreate = () => { setEditing(null); setDialogOpen(true) }
    const openEdit = (item: PortfolioTransaction) => { setEditing(item); setDialogOpen(true); setMenu(null) }

    return (
        <div className="mx-auto max-w-[1500px] space-y-7">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-7 text-white shadow-xl sm:px-8">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur"><WalletCards size={24} /></div>
                        <h1 className="text-3xl font-bold tracking-tight">{t("portfolio.title")}</h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{t("portfolio.description")}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row"><Link to="/portfolio/assets" className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"><Coins size={18} /> {t("activeHoldings.title")}</Link><button onClick={() => setImportOpen(true)} className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"><Download size={18} /> {t("portfolio.import")}</button><button onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"><Plus size={18} /> {t("portfolio.newTrade")}</button></div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: t("portfolio.activeAssets"), value: summary.activeAssets.toString(), detail: t("portfolio.remainingCoins"), icon: Coins, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" },
                    { label: t("portfolio.buyUsdValue"), value: money.format(summary.buyVolume), detail: t("portfolio.buyTrades", { count: transactions.filter(item => item.transactionType === "BUY").length }), icon: ArrowDownLeft, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
                    { label: t("portfolio.netUsdValue"), value: money.format(summary.netInvested), detail: t("portfolio.usdEnteredTrades"), icon: WalletCards, color: "text-sky-600 bg-sky-50 dark:bg-sky-950/50" },
                    { label: t("portfolio.platform"), value: summary.platforms.toString(), detail: t("portfolio.platformDetail"), icon: Building2, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
                ].map(card => <div key={card.label} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">{card.value}</p><p className="mt-1 text-xs text-gray-400">{card.detail}</p></div><span className={`rounded-xl p-2.5 ${card.color}`}><card.icon size={20} /></span></div></div>)}
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
                    <div><h2 className="font-bold text-gray-950 dark:text-white">{t("portfolio.history")}</h2><p className="mt-0.5 text-xs text-gray-500">{t("portfolio.records", { count: transactions.length })}</p></div>
                    <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-gray-200 p-2.5 text-gray-500 transition hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
                </div>

                {error ? <div className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</div> : loading ? <div className="flex min-h-64 items-center justify-center text-sm text-gray-500"><RefreshCw className="mr-2 animate-spin" size={18} /> {t("portfolio.loading")}</div> : transactions.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="mb-4 rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-950/50"><WalletCards size={30} /></div><h3 className="font-bold text-gray-900 dark:text-white">{t("portfolio.empty")}</h3><p className="mt-1 max-w-sm text-sm text-gray-500">{t("portfolio.emptyDescription")}</p><button onClick={openCreate} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{t("portfolio.addFirst")}</button></div>
                ) : (
                    <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead><tr className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:bg-gray-800/40"><th className="px-6 py-3.5">{t("portfolio.trade")}</th><th className="px-5 py-3.5">{t("portfolio.date")}</th><th className="px-5 py-3.5 text-right">{t("portfolio.received")}</th><th className="px-5 py-3.5 text-right">{t("portfolio.spent")}</th><th className="px-5 py-3.5 text-right">{t("portfolio.usdValue")}</th><th className="px-5 py-3.5">{t("portfolio.platform")}</th><th className="w-16 px-5 py-3.5" /></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{transactions.map(item => (
                        <tr key={item.id} className="group transition hover:bg-gray-50/70 dark:hover:bg-gray-800/30"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.transactionType === "BUY" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-rose-50 text-rose-600 dark:bg-rose-950/40"}`}>{item.transactionType === "BUY" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span><div><p className="font-bold text-gray-900 dark:text-white">{item.baseAsset}/{item.quoteAsset}</p><p className={`text-xs font-semibold ${item.transactionType === "BUY" ? "text-emerald-600" : "text-rose-600"}`}>{t(item.transactionType === "BUY" ? "portfolio.buy" : "portfolio.sell")} · {item.source === "MANUAL" ? t("portfolio.manual") : item.source.replace("_", " ")}</p></div></div></td><td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{date.format(new Date(item.tradedAt))}</td><td className="px-5 py-4 text-right font-mono text-sm text-gray-800 dark:text-gray-200">{number.format(item.receivedAmount)} {item.receivedAsset}</td><td className="px-5 py-4 text-right font-mono text-sm text-gray-800 dark:text-gray-200">{number.format(item.spentAmount)} {item.spentAsset}</td><td className="px-5 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">{item.usdValue > 0 ? money.format(item.usdValue) : "—"}</td><td className="px-5 py-4"><span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">{item.platform}</span></td><td className="relative px-5 py-4"><button onClick={() => setMenu(menu === item.id ? null : item.id)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"><MoreHorizontal size={18} /></button>{menu === item.id && <div className="absolute right-5 top-12 z-20 w-36 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-900"><button onClick={() => openEdit(item)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"><Pencil size={15} /> {t("portfolio.edit")}</button><button onClick={() => { setDeleting(item); setMenu(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 size={15} /> {t("portfolio.delete")}</button></div>}</td></tr>
                    ))}</tbody></table></div>
                )}
            </section>

            <TransactionDialog isOpen={dialogOpen} transaction={editing} onClose={() => { setDialogOpen(false); setEditing(null) }} onSave={save} />
            <ExchangeImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={load} />
            <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => void remove()} title={t("portfolio.deleteTitle")} message={t("portfolio.deleteMessage", { coin: deleting?.coinSymbol ?? "" })} confirmText={t("portfolio.delete")} variant="danger" />
        </div>
    )
}
