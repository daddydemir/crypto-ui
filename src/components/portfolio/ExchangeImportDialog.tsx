import { useState } from "react"
import { CalendarRange, Download, Inbox, Search } from "lucide-react"
import Modal from "@/components/common/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { importExchangeTrades, searchExchangeTrades, type PortfolioTransaction } from "@/services/portfolioService"
import { useTranslation } from "react-i18next"

const dateInputValue = (date: Date) => {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

const monthInputValue = (date: Date) => dateInputValue(date).slice(0, 7)

export default function ExchangeImportDialog({ isOpen, onClose, onImported }: { isOpen: boolean; onClose: () => void; onImported: () => Promise<void> }) {
	const { t, i18n } = useTranslation()
	const [exchange,setExchange]=useState<"BINANCE"|"BINANCE_TR"|"BTCTURK">("BINANCE")
	const [base,setBase]=useState("BTC"), [quote,setQuote]=useState("USDT")
	const [start,setStart]=useState(new Date(Date.now()-7*86400000).toISOString().slice(0,10)), [end,setEnd]=useState(new Date().toISOString().slice(0,10))
	const [startMonth, setStartMonth] = useState(monthInputValue(new Date()))
	const [endMonth, setEndMonth] = useState(monthInputValue(new Date()))
	const [quickRange, setQuickRange] = useState("")
	const [results,setResults]=useState<PortfolioTransaction[]>([]), [selected,setSelected]=useState<Set<string>>(new Set()), [busy,setBusy]=useState(false), [error,setError]=useState("")
	const [searched, setSearched] = useState(false)
	const key=(item:PortfolioTransaction)=>`${item.source}:${item.externalTradeId}:${item.baseAsset}${item.quoteAsset}`
	const changeExchange = (value: typeof exchange) => {
		setExchange(value)
		if (value === "BTCTURK") {
			setBase("")
			setQuote("")
		} else if (!base && !quote) {
			setBase("BTC")
			setQuote("USDT")
		}
	}
	const setRange = (range: "this-month" | "last-month" | "30-days" | "90-days") => {
		const today = new Date()
		let rangeStart = new Date(today)
		let rangeEnd = new Date(today)
		if (range === "this-month") rangeStart = new Date(today.getFullYear(), today.getMonth(), 1)
		if (range === "last-month") {
			rangeStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
			rangeEnd = new Date(today.getFullYear(), today.getMonth(), 0)
		}
		if (range === "30-days") rangeStart.setDate(today.getDate() - 29)
		if (range === "90-days") rangeStart.setDate(today.getDate() - 89)
		setStart(dateInputValue(rangeStart))
		setEnd(dateInputValue(rangeEnd))
		setStartMonth(monthInputValue(rangeStart))
		setEndMonth(monthInputValue(rangeEnd))
		setQuickRange(range)
	}
	const applyMonthRange = (fromMonth: string, toMonth: string) => {
		if (!fromMonth || !toMonth) return
		setQuickRange("months")
		const [startYear, startMonthNumber] = fromMonth.split("-").map(Number)
		const [endYear, endMonthNumber] = toMonth.split("-").map(Number)
		const firstDay = new Date(startYear, startMonthNumber - 1, 1)
		const lastDay = new Date(endYear, endMonthNumber, 0)
		const today = new Date()
		setStart(dateInputValue(firstDay))
		setEnd(dateInputValue(lastDay > today ? today : lastDay))
	}
	const changeStartMonth = (month: string) => {
		setStartMonth(month)
		const nextEndMonth = month > endMonth ? month : endMonth
		setEndMonth(nextEndMonth)
		applyMonthRange(month, nextEndMonth)
	}
	const changeEndMonth = (month: string) => {
		setEndMonth(month)
		applyMonthRange(startMonth, month)
	}
	const search=async()=>{
		setBusy(true)
		setError("")
		setSearched(false)
		setResults([])
		setSelected(new Set())
		try {
			if (!start || !end) throw new Error(t("portfolio.importDialog.dateRequired"))
			if (exchange !== "BTCTURK" && (!base.trim() || !quote.trim())) throw new Error(t("portfolio.importDialog.pairRequired"))
			if (exchange === "BTCTURK" && Boolean(base.trim()) !== Boolean(quote.trim())) throw new Error(t("portfolio.importDialog.btcturkPair"))
			const startDate = new Date(`${start}T00:00:00`)
			const endDate = new Date(`${end}T23:59:59`)
			if (startDate > endDate) throw new Error(t("portfolio.importDialog.dateOrder"))
			if (endDate.getTime() - startDate.getTime() > 90 * 86400000) throw new Error(t("portfolio.importDialog.max90"))
			const response = await searchExchangeTrades({exchange,baseAsset:base,quoteAsset:quote,startDate:startDate.toISOString(),endDate:endDate.toISOString()})
			if (response !== null && !Array.isArray(response)) throw new Error(t("portfolio.importDialog.unexpected"))
			const data = response ?? []
			setResults(data)
			setSelected(new Set(data.map(key)))
			setSearched(true)
		} catch(e) {
			setError(e instanceof Error ? e.message : t("portfolio.importDialog.searchError"))
		} finally {
			setBusy(false)
		}
	}
	const save=async()=>{setBusy(true);setError("");try{await importExchangeTrades(results.filter(x=>selected.has(key(x))));await onImported();onClose()}catch(e){setError(e instanceof Error?e.message:t("portfolio.importDialog.importError"))}finally{setBusy(false)}}
	const input="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm uppercase outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800"
	return <Modal isOpen={isOpen} onClose={onClose} title={t("portfolio.importDialog.title")} maxWidth="max-w-5xl"><div className="space-y-5">
		<div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><CalendarRange size={17} className="text-indigo-500"/>{t("portfolio.importDialog.period")}</div><div className="flex flex-wrap gap-2">{([['this-month','thisMonth'],['last-month','lastMonth'],['30-days','last30'],['90-days','last90']] as const).map(([value,label])=><button type="button" key={value} onClick={()=>setRange(value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${quickRange===value?'border-indigo-600 bg-indigo-600 text-white':'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{t(`portfolio.importDialog.${label}`)}</button>)}</div><div className={`mt-3 grid gap-3 rounded-xl border p-3 sm:grid-cols-2 ${quickRange==='months'?'border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/20':'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}><label className="text-xs font-semibold text-slate-500">{t("portfolio.importDialog.startMonth")}<input type="month" value={startMonth} max={monthInputValue(new Date())} onChange={e=>changeStartMonth(e.target.value)} className="mt-1 block w-full bg-transparent py-1 text-sm text-slate-800 outline-none dark:text-slate-100"/></label><label className="text-xs font-semibold text-slate-500">{t("portfolio.importDialog.endMonth")}<input type="month" value={endMonth} min={startMonth} max={monthInputValue(new Date())} onChange={e=>changeEndMonth(e.target.value)} className="mt-1 block w-full bg-transparent py-1 text-sm text-slate-800 outline-none dark:text-slate-100"/></label></div><p className="mt-2 text-xs text-slate-400">{t("portfolio.importDialog.monthHint")}</p></div>
		<div className="grid gap-3 md:grid-cols-5"><Select value={exchange} onValueChange={v=>changeExchange(v as typeof exchange)}><SelectTrigger className="h-10 w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="BINANCE">Binance</SelectItem><SelectItem value="BINANCE_TR">Binance TR</SelectItem><SelectItem value="BTCTURK">BtcTurk Pro</SelectItem></SelectContent></Select><input className={input} value={base} onChange={e=>setBase(e.target.value)} placeholder={exchange === "BTCTURK" ? t("portfolio.importDialog.baseOptional") : "Base: BTC"}/><input className={input} value={quote} onChange={e=>setQuote(e.target.value)} placeholder={exchange === "BTCTURK" ? t("portfolio.importDialog.quoteOptional") : "Quote: USDT"}/><input className={input} type="date" value={start} onChange={e=>{setStart(e.target.value);setQuickRange("")}}/><input className={input} type="date" value={end} onChange={e=>{setEnd(e.target.value);setQuickRange("")}}/></div>
		{exchange === "BTCTURK" && <p className="-mt-3 text-xs text-slate-500">{t("portfolio.importDialog.btcturkHint")}</p>}
		<button onClick={()=>void search()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"><Search size={17}/>{t(busy?"portfolio.importDialog.searching":"portfolio.importDialog.search")}</button>
		{error&&<p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
		{searched && !busy && results.length === 0 && !error && <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-700"><span className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-500 dark:bg-slate-800"><Inbox size={24}/></span><p className="font-semibold text-slate-800 dark:text-slate-100">{t("portfolio.importDialog.empty")}</p><p className="mt-1 text-sm text-slate-500">{t("portfolio.importDialog.emptyDescription")}</p></div>}
		{results.length>0&&<><div className="max-h-96 overflow-auto rounded-xl border dark:border-gray-700"><table className="w-full min-w-[760px] text-sm"><thead className="sticky top-0 bg-gray-50 text-left dark:bg-gray-800"><tr><th className="p-3"><input type="checkbox" checked={selected.size===results.length} onChange={e=>setSelected(e.target.checked?new Set(results.map(key)):new Set())}/></th><th>{t("portfolio.importDialog.type")}</th><th>{t("portfolio.importDialog.pair")}</th><th>{t("portfolio.received")}</th><th>{t("portfolio.spent")}</th><th>{t("portfolio.importDialog.fee")}</th><th>{t("portfolio.date")}</th></tr></thead><tbody>{results.map(item=><tr key={key(item)} className="border-t dark:border-gray-800"><td className="p-3"><input type="checkbox" checked={selected.has(key(item))} onChange={()=>setSelected(prev=>{const next=new Set(prev);if(next.has(key(item))) next.delete(key(item));else next.add(key(item));return next})}/></td><td className={item.transactionType==="BUY"?"text-emerald-600":"text-rose-600"}>{t(item.transactionType==="BUY"?"portfolio.buy":"portfolio.sell")}</td><td className="font-semibold">{item.baseAsset}/{item.quoteAsset}</td><td>{item.receivedAmount} {item.receivedAsset}</td><td>{item.spentAmount} {item.spentAsset}</td><td>{item.feeAmount} {item.feeAsset}</td><td>{new Date(item.tradedAt).toLocaleString(i18n.language === "tr" ? "tr-TR" : "en-US")}</td></tr>)}</tbody></table></div><div className="flex items-center justify-between"><p className="text-sm text-gray-500">{t("portfolio.importDialog.selected", { selected: selected.size, total: results.length })}</p><button onClick={()=>void save()} disabled={busy||selected.size===0} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Download size={17}/>{t("portfolio.importDialog.addSelected")}</button></div></>}
	</div></Modal>
}
