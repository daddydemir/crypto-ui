import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Info, TrendingUp, TrendingDown, Activity } from "lucide-react"
import Modal from "@/components/common/Modal"

import { getMACD, type MACDPoint } from "@/services/macdService"
import { type Coin } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapMACDToChartPoints } from "@/components/charts/types.ts"
import AnalysisPageLayout from "@/components/analyses/AnalysisPageLayout"
import StatCard from "@/components/analyses/StatCard"
import AnalysisChart from "@/components/analyses/AnalysisChart"
import { useTimeRangeFilter, type TimeRange } from "@/hooks/useTimeRangeFilter"

const MACDPage: React.FC = () => {
    const { t } = useTranslation()
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)
    const [selectedCoin, setSelectedCoin] = useState<Coin>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<MACDPoint[]>({
        cacheKey: `macd-${selectedCoin?.symbol}`,
        fetchFn: () => selectedCoin?.symbol ? getMACD(selectedCoin.symbol) : Promise.resolve([])
    })

    const filteredData = useTimeRangeFilter({
        data,
        timeRange,
        dateExtractor: (item) => item.date
    })

    const formatValue = (value: number): string => {
        if (Math.abs(value) >= 1000) {
            return value.toFixed(0)
        } else if (Math.abs(value) >= 1) {
            return value.toFixed(2)
        }
        return value.toFixed(4)
    }

    const stats = useMemo(() => {
        if (filteredData.length === 0) return {
            macdCurrent: 0, macdChange: 0,
            signalCurrent: 0, signalChange: 0,
            histogramCurrent: 0, histogramChange: 0
        }

        const latest = filteredData[filteredData.length - 1]
        const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : latest

        return {
            macdCurrent: latest.macd,
            macdChange: latest.macd - previous.macd,
            signalCurrent: latest.signal,
            signalChange: latest.signal - previous.signal,
            histogramCurrent: latest.histogram,
            histogramChange: latest.histogram - previous.histogram
        }
    }, [filteredData])

    const yAxisDomain = useMemo(() => {
        if (filteredData.length === 0) return ['auto', 'auto'] as [string, string]

        const allValues = filteredData.flatMap(d => [d.macd, d.signal, d.histogram])
        const minValue = Math.min(...allValues)
        const maxValue = Math.max(...allValues)

        const padding = (maxValue - minValue) * 0.05
        return [minValue - padding, maxValue + padding] as [number, number]
    }, [filteredData])

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(data.date).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            MACD: {formatValue(data.macd)}
                        </p>
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                            {t('macd.signal', 'Signal')}: {formatValue(data.signal)}
                        </p>
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {t('macd.histogram', 'Histogram')}: {formatValue(data.histogram)}
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    const chartLines = [
        { dataKey: 'macd', name: 'MACD', color: '#3B82F6' },
        { dataKey: 'signal', name: t('macd.signal', 'Signal'), color: '#F97316' },
        { dataKey: 'histogram', name: t('macd.histogram', 'Histogram'), color: '#A855F7', type: 'bar' as const }
    ]

    return (
        <>
            {showFullScreenChart && data && selectedCoin && (
                <FullScreenChart
                    data={mapMACDToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='macd'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}

            <AnalysisPageLayout
                title={t('macd.title', 'MACD')}
                headerContent={
                    <button
                        onClick={() => setIsDetailOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        <Info className="w-4 h-4" />
                        {t("indicators.detail", "Detail")}
                    </button>
                }
                description={t('macd.description', 'Moving Average Convergence Divergence analysis for different cryptocurrencies')}
                selectedCoin={selectedCoin}
                onCoinChange={setSelectedCoin}
                onRefresh={refresh}
                refreshing={refreshing}
                lastUpdateText={lastUpdateText}
                loading={loading}
                error={error}
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard
                        label={`MACD (${t('common.current', 'Current')})`}
                        value={formatValue(stats.macdCurrent)}
                        change={stats.macdChange}
                        changeValue={formatValue(stats.macdChange)}
                        color="blue"
                    />
                    <StatCard
                        label={`${t('macd.signal', 'Signal')} (${t('common.current', 'Current')})`}
                        value={formatValue(stats.signalCurrent)}
                        change={stats.signalChange}
                        changeValue={formatValue(stats.signalChange)}
                        color="orange"
                    />
                    <StatCard
                        label={`${t('macd.histogram', 'Histogram')} (${t('common.current', 'Current')})`}
                        value={formatValue(stats.histogramCurrent)}
                        change={stats.histogramChange}
                        changeValue={formatValue(stats.histogramChange)}
                        color="purple"
                    />
                </div>

                {/* Chart */}
                <div className="mb-6">
                    <AnalysisChart
                        data={filteredData}
                        lines={chartLines}
                        timeRange={timeRange}
                        onTimeRangeChange={setTimeRange}
                        onFullScreen={() => setShowFullScreenChart(true)}
                        title={`${selectedCoin?.symbol.toUpperCase()} ${t('macd.title', 'MACD')}`}
                        subtitle={t('macd.chartDescription', 'MACD line, Signal line, and Histogram')}
                        dateKey="date"
                        yAxisDomain={yAxisDomain}
                        tooltipContent={<CustomTooltip />}
                    />
                </div>
            </AnalysisPageLayout>

            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={t("indicators.macd.title")}
            >
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        {t("indicators.macd.description")}
                    </p>

                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                            {t("indicators.rsi.interpretation.title", "Interpretation")}
                        </h4>
                        <div className="grid gap-4">
                            {(t("indicators.macd.interpretation.levels", { returnObjects: true }) as any[]).map((level, i) => (
                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="font-medium text-blue-600 dark:text-blue-400 block mb-1">
                                        {level.value}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {level.meaning}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                {t("indicators.macd.interpretation.buy_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.macd.interpretation.buy_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                {t("indicators.macd.interpretation.sell_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.macd.interpretation.sell_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {t("indicators.macd.warnings.title")}
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                            {(t("indicators.macd.warnings.items", { returnObjects: true }) as string[]).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                {t("indicators.macd.tip.title")}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {t("indicators.macd.tip.content")}
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default MACDPage
