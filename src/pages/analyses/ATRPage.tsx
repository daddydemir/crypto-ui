import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Info, TrendingUp, TrendingDown, Activity } from "lucide-react"
import Modal from "@/components/common/Modal"
import { getATR, type ATRPoint } from "@/services/atrService"
import { type Coin } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapATRToChartPoints } from "@/components/charts/types"
import AnalysisPageLayout from "@/components/analyses/AnalysisPageLayout"
import StatCard from "@/components/analyses/StatCard"
import AnalysisChart from "@/components/analyses/AnalysisChart"
import { useTimeRangeFilter, type TimeRange } from "@/hooks/useTimeRangeFilter"

const ATRPage: React.FC = () => {
    const { t } = useTranslation()
    const [selectedCoin, setSelectedCoin] = useState<Coin>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<ATRPoint[]>({
        cacheKey: `atr-${selectedCoin?.symbol}`,
        fetchFn: () => selectedCoin?.symbol ? getATR(selectedCoin.symbol) : Promise.resolve([])
    })

    const filteredData = useTimeRangeFilter({
        data,
        timeRange,
        dateExtractor: (item) => item.Time
    })

    const formatPrice = (value: number): string => {
        if (value >= 1) {
            return value.toFixed(2)
        }
        return value.toFixed(6)
    }

    const stats = useMemo(() => {
        if (filteredData.length === 0) return {
            current: 0,
            change: 0,
            highest: 0,
            lowest: 0,
            average: 0
        }

        const latest = filteredData[filteredData.length - 1]
        const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : latest

        const values = filteredData.map(d => d.Point)
        const sum = values.reduce((acc, val) => acc + val, 0)

        return {
            current: latest.Point,
            change: latest.Point - previous.Point,
            highest: Math.max(...values),
            lowest: Math.min(...values),
            average: sum / values.length
        }
    }, [filteredData])

    const yAxisDomain = useMemo(() => {
        if (filteredData.length === 0) return ['auto', 'auto'] as [string, string]

        const allValues = filteredData.map(d => d.Point)
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
                        {new Date(data.Time).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            ATR: {formatPrice(data.Point)}
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    const chartLines = [
        { dataKey: 'Point', name: 'ATR', color: '#3B82F6' }
    ]

    return (
        <>
            {showFullScreenChart && data && selectedCoin && (
                <FullScreenChart
                    data={mapATRToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='atr'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}

            <AnalysisPageLayout
                title={t('atr.title', 'Average True Range')}
                headerContent={
                    <button
                        onClick={() => setIsDetailOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        <Info className="w-4 h-4" />
                        {t("indicators.detail", "Detail")}
                    </button>
                }
                description={t('atr.description', 'View ATR volatility analysis for different cryptocurrencies')}
                selectedCoin={selectedCoin}
                onCoinChange={setSelectedCoin}
                onRefresh={refresh}
                refreshing={refreshing}
                lastUpdateText={lastUpdateText}
                loading={loading}
                error={error}
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <StatCard
                        label={t('atr.current', 'Current ATR')}
                        value={formatPrice(stats.current)}
                        change={stats.change}
                        changeValue={formatPrice(Math.abs(stats.change))}
                        color="blue"
                    />
                    <StatCard
                        label={t('atr.highest', 'Highest')}
                        value={formatPrice(stats.highest)}
                        color="red"
                    />
                    <StatCard
                        label={t('atr.lowest', 'Lowest')}
                        value={formatPrice(stats.lowest)}
                        color="green"
                    />
                    <StatCard
                        label={t('atr.average', 'Average')}
                        value={formatPrice(stats.average)}
                        color="blue"
                    />
                    <StatCard
                        label={t('atr.range', 'Range')}
                        value={formatPrice(stats.highest - stats.lowest)}
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
                    title={`${selectedCoin?.symbol.toUpperCase()} ${t('atr.title', 'Average True Range')}`}
                    subtitle={t('atr.chartDescription', 'ATR measures market volatility')}
                    dateKey="Time"
                    yAxisFormatter={(value) => formatPrice(value)}
                    yAxisDomain={yAxisDomain}
                    tooltipContent={<CustomTooltip />}
                />
            </AnalysisPageLayout>

            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={t("indicators.atr.title")}
            >
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        {t("indicators.atr.description")}
                    </p>

                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                            {t("indicators.rsi.interpretation.title", "Interpretation")}
                        </h4>
                        <div className="grid gap-4">
                            {(t("indicators.atr.interpretation.levels", { returnObjects: true }) as any[]).map((level, i) => (
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
                                {t("indicators.atr.interpretation.buy_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.atr.interpretation.buy_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                {t("indicators.atr.interpretation.sell_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.atr.interpretation.sell_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {t("indicators.atr.warnings.title")}
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                            {(t("indicators.atr.warnings.items", { returnObjects: true }) as string[]).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                {t("indicators.atr.tip.title")}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {t("indicators.atr.tip.content")}
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default ATRPage