import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Info, TrendingUp, TrendingDown, Activity } from "lucide-react"
import Modal from "@/components/common/Modal"

import { type Coin } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import { getMovingAverages, type MovingAveragePoint } from "@/services/exponentialMAService.ts"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapExponentialMAToChartPoints } from "@/components/charts/types.ts"
import AnalysisPageLayout from "@/components/analyses/AnalysisPageLayout"
import StatCard from "@/components/analyses/StatCard"
import AnalysisChart from "@/components/analyses/AnalysisChart"
import { useTimeRangeFilter, type TimeRange } from "@/hooks/useTimeRangeFilter"

const ExponentialMAPage: React.FC = () => {
    const { t } = useTranslation()
    const [selectedCoin, setSelectedCoin] = useState<Coin>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<MovingAveragePoint[]>({
        cacheKey: `exponential-moving-averages-${selectedCoin?.id}`,
        fetchFn: () => selectedCoin?.id ? getMovingAverages(selectedCoin.id) : Promise.resolve([])
    })

    const filteredData = useTimeRangeFilter({
        data,
        timeRange,
        dateExtractor: (item) => item.date
    })

    const stats = useMemo(() => {
        if (filteredData.length === 0) return {
            ma7Current: 0, ma7Change: 0,
            ma25Current: 0, ma25Change: 0,
            ma99Current: 0, ma99Change: 0
        }

        const latest = filteredData[filteredData.length - 1]
        const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : latest

        return {
            ma7Current: latest.ma7,
            ma7Change: latest.ma7 - previous.ma7,
            ma25Current: latest.ma25,
            ma25Change: latest.ma25 - previous.ma25,
            ma99Current: latest.ma99,
            ma99Change: latest.ma99 - previous.ma99
        }
    }, [filteredData])

    const yAxisDomain = useMemo(() => {
        if (filteredData.length === 0) return ['auto', 'auto'] as [string, string]

        const allValues = filteredData.flatMap(d => [d.ma7, d.ma25, d.ma99])
        const minValue = Math.min(...allValues)
        const maxValue = Math.max(...allValues)

        const padding = (maxValue - minValue) * 0.02
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
                        <p className="text-sm font-semibold text-amber-500 dark:text-amber-400">
                            Price: ${data.price?.toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            MA 7: ${data.ma7.toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            MA 25: ${data.ma25.toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                            MA 99: ${data.ma99.toFixed(2)}
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    const chartLines = [
        { dataKey: 'ma7', name: 'MA 7', color: '#3B82F6' },
        { dataKey: 'ma25', name: 'MA 25', color: '#10B981' },
        { dataKey: 'ma99', name: 'MA 99', color: '#F97316' },
        { dataKey: 'price', name: 'Price', color: '#F59E0B' }
    ]

    return (
        <>
            {showFullScreenChart && data && selectedCoin && (
                <FullScreenChart
                    data={mapExponentialMAToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='exponentialMovingAverages'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}

            <AnalysisPageLayout
                title={t('exponentialMovingAverages.title', 'Moving Averages')}
                headerContent={
                    <button
                        onClick={() => setIsDetailOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        <Info className="w-4 h-4" />
                        {t("indicators.detail", "Detail")}
                    </button>
                }
                description={t('exponentialMovingAverages.description', 'View moving average trends for different cryptocurrencies')}
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
                        label={`MA 7 (${t('common.current', 'Current')})`}
                        value={`$${stats.ma7Current.toFixed(2)}`}
                        change={stats.ma7Change}
                        changeValue={`$${stats.ma7Change.toFixed(2)}`}
                        color="blue"
                    />
                    <StatCard
                        label={`MA 25 (${t('common.current', 'Current')})`}
                        value={`$${stats.ma25Current.toFixed(2)}`}
                        change={stats.ma25Change}
                        changeValue={`$${stats.ma25Change.toFixed(2)}`}
                        color="green"
                    />
                    <StatCard
                        label={`MA 99 (${t('common.current', 'Current')})`}
                        value={`$${stats.ma99Current.toFixed(2)}`}
                        change={stats.ma99Change}
                        changeValue={`$${stats.ma99Change.toFixed(2)}`}
                        color="orange"
                    />
                </div>

                {/* Chart */}
                <AnalysisChart
                    data={filteredData}
                    lines={chartLines}
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                    onFullScreen={() => setShowFullScreenChart(true)}
                    title={`${selectedCoin?.symbol.toUpperCase()} ${t('exponentialMovingAverages.title', 'Moving Averages')}`}
                    subtitle={t('exponentialMovingAverages.chartDescription', '7-day, 25-day, and 99-day moving averages')}
                    dateKey="date"
                    yAxisDomain={yAxisDomain}
                    tooltipContent={<CustomTooltip />}
                />
            </AnalysisPageLayout>

            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={t("indicators.ema.title")}
            >
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        {t("indicators.ema.description")}
                    </p>

                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                            {t("indicators.rsi.interpretation.title", "Interpretation")}
                        </h4>
                        <div className="grid gap-4">
                            {(t("indicators.ema.interpretation.levels", { returnObjects: true }) as any[]).map((level, i) => (
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
                                {t("indicators.ema.interpretation.buy_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.ema.interpretation.buy_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                {t("indicators.ema.interpretation.sell_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.ema.interpretation.sell_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {t("indicators.ema.warnings.title")}
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                            {(t("indicators.ema.warnings.items", { returnObjects: true }) as string[]).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                {t("indicators.ema.tip.title")}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {t("indicators.ema.tip.content")}
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default ExponentialMAPage