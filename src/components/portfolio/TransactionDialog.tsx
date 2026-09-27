import { useEffect, useState, type FormEvent } from "react"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import Modal from "@/components/common/Modal"
import type { PortfolioTransaction, PortfolioTransactionInput, TransactionType } from "@/services/portfolioService"
import { useTranslation } from "react-i18next"

interface Props {
    isOpen: boolean
    transaction?: PortfolioTransaction | null
    onClose: () => void
    onSave: (value: PortfolioTransactionInput) => Promise<void>
}

const nowForInput = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
}

export default function TransactionDialog({ isOpen, transaction, onClose, onSave }: Props) {
    const { t } = useTranslation()
    const [type, setType] = useState<TransactionType>("BUY")
	const [baseAsset, setBaseAsset] = useState("")
	const [quoteAsset, setQuoteAsset] = useState("")
	const [receivedAmount, setReceivedAmount] = useState("")
	const [spentAmount, setSpentAmount] = useState("")
	const [usdValue, setUsdValue] = useState("")
    const [platform, setPlatform] = useState("")
    const [tradedAt, setTradedAt] = useState(nowForInput())
    const [notes, setNotes] = useState("")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        setType(transaction?.transactionType ?? "BUY")
		setBaseAsset(transaction?.baseAsset ?? "")
		setQuoteAsset(transaction?.quoteAsset ?? "")
		setReceivedAmount(transaction?.receivedAmount.toString() ?? "")
		setSpentAmount(transaction?.spentAmount.toString() ?? "")
		setUsdValue(transaction?.usdValue ? transaction.usdValue.toString() : "")
        setPlatform(transaction?.platform ?? "")
        setTradedAt(transaction ? new Date(transaction.tradedAt).toISOString().slice(0, 16) : nowForInput())
        setNotes(transaction?.notes ?? "")
        setError("")
    }, [transaction, isOpen])

    const submit = async (event: FormEvent) => {
        event.preventDefault()
        setSaving(true)
        setError("")
        try {
            await onSave({
                transactionType: type,
				coinSymbol: baseAsset.trim().toUpperCase(), baseAsset: baseAsset.trim().toUpperCase(), quoteAsset: quoteAsset.trim().toUpperCase(),
				receivedAsset: (type === "BUY" ? baseAsset : quoteAsset).trim().toUpperCase(), receivedAmount: Number(receivedAmount),
				spentAsset: (type === "BUY" ? quoteAsset : baseAsset).trim().toUpperCase(), spentAmount: Number(spentAmount),
				usdValue: Number(usdValue || 0), feeAmount: transaction?.feeAmount ?? 0, feeAsset: transaction?.feeAsset ?? "",
				source: transaction?.source ?? "MANUAL", externalTradeId: transaction?.externalTradeId ?? "",
                platform: platform.trim(),
                tradedAt: new Date(tradedAt).toISOString(),
                notes: notes.trim(),
            })
            onClose()
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t("portfolio.form.saveError"))
        } finally {
            setSaving(false)
        }
    }

    const fieldClass = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-800"

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t(transaction ? "portfolio.form.editTitle" : "portfolio.form.createTitle")} maxWidth="max-w-2xl">
            <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-800">
                    {(["BUY", "SELL"] as TransactionType[]).map(value => (
                        <button key={value} type="button" onClick={() => setType(value)} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${type === value ? value === "BUY" ? "bg-white text-emerald-600 shadow-sm dark:bg-gray-900" : "bg-white text-rose-600 shadow-sm dark:bg-gray-900" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}>
                            {value === "BUY" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                            {t(value === "BUY" ? "portfolio.buy" : "portfolio.sell")}
                        </button>
                    ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
					<label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{t("portfolio.form.baseAsset")}
						<input className={fieldClass} value={baseAsset} onChange={e => setBaseAsset(e.target.value.toUpperCase())} placeholder="BTC" maxLength={20} required />
                    </label>
					<label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{t("portfolio.form.quoteAsset")}
						<input className={fieldClass} value={quoteAsset} onChange={e => setQuoteAsset(e.target.value.toUpperCase())} placeholder="USDT, TRY, BTC..." maxLength={20} required />
                    </label>
					<label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{t("portfolio.form.receivedAmount")} ({type === "BUY" ? baseAsset || t("portfolio.form.base") : quoteAsset || t("portfolio.form.quote")})
						<input className={fieldClass} type="number" min="0" step="any" value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} placeholder="0.00" required />
                    </label>
					<label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{t("portfolio.form.spentAmount")} ({type === "BUY" ? quoteAsset || t("portfolio.form.quote") : baseAsset || t("portfolio.form.base")})
						<input className={fieldClass} type="number" min="0" step="any" value={spentAmount} onChange={e => setSpentAmount(e.target.value)} placeholder="0.00" required />
                    </label>
					<label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{t("portfolio.usdValue")} <span className="font-normal text-gray-400">({t("portfolio.form.optional")})</span><input className={fieldClass} type="number" min="0" step="any" value={usdValue} onChange={e => setUsdValue(e.target.value)} placeholder="0.00" /></label>
					<label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{t("portfolio.platform")}<input className={fieldClass} value={platform} onChange={e => setPlatform(e.target.value)} placeholder="Binance, Binance TR..." maxLength={80} required /></label>
                    <label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-2">{t("portfolio.form.tradeDate")}
                        <input className={fieldClass} type="datetime-local" value={tradedAt} onChange={e => setTradedAt(e.target.value)} required />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-2">{t("portfolio.form.note")} <span className="font-normal text-gray-400">({t("portfolio.form.optional")})</span>
                        <textarea className={`${fieldClass} min-h-20 resize-none`} value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} placeholder={t("portfolio.form.notePlaceholder")} />
                    </label>
                </div>

                {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                    <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{t("portfolio.form.cancel")}</button>
                    <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50">{t(saving ? "portfolio.form.saving" : "portfolio.form.save")}</button>
                </div>
            </form>
        </Modal>
    )
}
