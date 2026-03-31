import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { type Coin } from "@/services/coinService"
import { getCoinHistory } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import { DirectionalRangeStrip, type ChartDatum } from "@/components/charts/DirectionalRangeStrip"
import AnalysisPageLayout from "@/components/analyses/AnalysisPageLayout"

const DirectionalRangeStripPage: React.FC = () => {
    const { t } = useTranslation()
    const [selectedCoin, setSelectedCoin] = useState<Coin>()
    const [selectedYear, setSelectedYear] = useState<string>("2026")
    const [selectedMonth, setSelectedMonth] = useState<string>("")

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<ChartDatum[]>({
        cacheKey: `coin-history-${selectedCoin?.symbol}-${selectedYear}-${selectedMonth}`,
        fetchFn: () => selectedCoin?.symbol ? getCoinHistory(selectedCoin.symbol, selectedYear, selectedMonth) : Promise.resolve([])
    })

    return (
        <AnalysisPageLayout
            title={t('drs.title', 'Directional Range Strip')}
            description={t('drs.description', 'Custom directional range strip analysis for cryptocurrencies based on closing prices.')}
            selectedCoin={selectedCoin}
            onCoinChange={setSelectedCoin}
            onRefresh={refresh}
            refreshing={refreshing}
            lastUpdateText={lastUpdateText}
            loading={loading}
            error={error}
        >
            <div className="flex gap-4 mb-6">
                <select 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                </select>
                
                <select 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-32"
                >
                    <option value="">{t('common.all', 'All')} {t('common.months', 'Months')}</option>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i+1} value={String(i+1).padStart(2, '0')}>
                            {new Date(0, i).toLocaleString(t('common.locale', 'en-US'), { month: 'long' })}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-6 h-[500px]">
                {data && data.length > 0 ? (
                    <DirectionalRangeStrip 
                        data={data} 
                        year={selectedMonth ? `${new Date(0, parseInt(selectedMonth)-1).toLocaleString(t('common.locale', 'en-US'), { month: 'short' })} ${selectedYear}` : selectedYear}
                        width={1200}
                        height={500}
                    />
                ) : (
                    !loading && (
                        <div className="h-full w-full flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-sm">
                            {t("common.noData", "No data available for selected coin")}
                        </div>
                    )
                )}
            </div>

            {data && data.length > 0 && (() => {
                const maxHighPoint = data.reduce((a, b) => a.High > b.High ? a : b);
                const minLowPoint = data.reduce((a, b) => a.Low < b.Low ? a : b);
                const volatility = ((maxHighPoint.High - minLowPoint.Low) / minLowPoint.Low) * 100;
                
                return (
                    <div className="mt-8 pb-12">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl">
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                    {t('drs.statistics', 'Period Statistics')}
                                </h3>
                                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded tracking-widest uppercase">
                                    {selectedYear}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                                <div className="p-6 group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path></svg>
                                        </div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{t('drs.high', 'High')}</span>
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mb-2 tracking-tight">
                                        ${maxHighPoint.High.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        {new Date(maxHighPoint.Time).toLocaleDateString(t('common.locale', 'tr-TR'), { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>

                                <div className="p-6 group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"></path></svg>
                                        </div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{t('drs.low', 'Low')}</span>
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mb-2 tracking-tight">
                                        ${minLowPoint.Low.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        {new Date(minLowPoint.Time).toLocaleDateString(t('common.locale', 'tr-TR'), { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-slate-800/20 group transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner group-hover:rotate-12 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                        </div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{t('drs.volatility', 'Volatility')}</span>
                                    </div>
                                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono mb-2 tracking-tight">
                                        {volatility.toFixed(1)}%
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                        <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                            {t('drs.range', 'Range')}: ${(maxHighPoint.High - minLowPoint.Low).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </AnalysisPageLayout>
    )
}

export default DirectionalRangeStripPage
