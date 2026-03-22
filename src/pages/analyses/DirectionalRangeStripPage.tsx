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
                        <div className="h-full w-full flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-2xl">
                            {t("common.noData", "No data available for selected coin")}
                        </div>
                    )
                )}
            </div>
        </AnalysisPageLayout>
    )
}

export default DirectionalRangeStripPage
