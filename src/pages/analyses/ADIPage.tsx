import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Info, TrendingUp, TrendingDown, Activity } from "lucide-react"
import Modal from "@/components/common/Modal"

import { getADI, type ADIPoint } from "@/services/adiService"
import { type Coin } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapADIToChartPoints } from "@/components/charts/types.ts"
import AnalysisPageLayout from "@/components/analyses/AnalysisPageLayout"
import StatCard from "@/components/analyses/StatCard"
import AnalysisChart from "@/components/analyses/AnalysisChart"
import { useTimeRangeFilter, type TimeRange } from "@/hooks/useTimeRangeFilter"

const ADIPage: React.FC = () => {
    const { t } = useTranslation()
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)
    const [selectedCoin, setSelectedCoin] = useState<Coin>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<ADIPoint[]>({
        cacheKey: `adi-${selectedCoin?.symbol}`,
        fetchFn: () => selectedCoin?.symbol ? getADI(selectedCoin.symbol) : Promise.resolve([])
    })

    const filteredData = useTimeRangeFilter({
        data,
        timeRange,
        dateExtractor: (item) => item.date
    })

    const formatValue = (value: number): string => {
        if (Math.abs(value) >= 1) {
            return value.toFixed(2)
        }
        return value.toFixed(4)
    }

    const stats = useMemo(() => {
        if (filteredData.length === 0) return {
            adiCurrent: 0, adiChange: 0,
            pdiCurrent: 0, pdiChange: 0,
            mdiCurrent: 0, mdiChange: 0
        }

        const latest = filteredData[filteredData.length - 1]
        const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : latest

        return {
            adiCurrent: latest.adi,
            adiChange: latest.adi - previous.adi,
            pdiCurrent: latest.pdi,
            pdiChange: latest.pdi - previous.pdi,
            mdiCurrent: latest.mdi,
            mdiChange: latest.mdi - previous.mdi
        }
    }, [filteredData])

    const yAxisDomain = useMemo(() => {
        if (filteredData.length === 0) return ['auto', 'auto'] as [string, string]

        const allValues = filteredData.flatMap(d => [d.adi, d.pdi, d.mdi, d.dx])
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
                            {t('adi.adi', 'ADX')}: {formatValue(data.adi)}
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {t('adi.pdi', '+DI')}: {formatValue(data.pdi)}
                        </p>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {t('adi.mdi', '-DI')}: {formatValue(data.mdi)}
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    const chartLines = [
        { dataKey: 'adi', name: t('adi.adi', 'ADX'), color: '#3B82F6' },
        { dataKey: 'pdi', name: t('adi.pdi', '+DI'), color: '#22C55E' },
        { dataKey: 'mdi', name: t('adi.mdi', '-DI'), color: '#EF4444' }
    ]

    return (
        <>
            {showFullScreenChart && data && selectedCoin && (
                <FullScreenChart
                    data={mapADIToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='adi'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}

            <AnalysisPageLayout
                title={t('adi.title', 'ADX')}
                headerContent={
                    <button
                        onClick={() => setIsDetailOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        <Info className="w-4 h-4" />
                        {t("indicators.detail", "Detail")}
                    </button>
                }
                description={t('adi.description', 'Average Directional Index analysis for different cryptocurrencies')}
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
                        label={`${t('adi.adi', 'ADX')} (${t('common.current', 'Current')})`}
                        value={formatValue(stats.adiCurrent)}
                        change={stats.adiChange}
                        changeValue={formatValue(Math.abs(stats.adiChange))}
                        color="blue"
                    />
                    <StatCard
                        label={`${t('adi.pdi', '+DI')} (${t('common.current', 'Current')})`}
                        value={formatValue(stats.pdiCurrent)}
                        change={stats.pdiChange}
                        changeValue={formatValue(Math.abs(stats.pdiChange))}
                        color="green"
                    />
                    <StatCard
                        label={`${t('adi.mdi', '-DI')} (${t('common.current', 'Current')})`}
                        value={formatValue(stats.mdiCurrent)}
                        change={stats.mdiChange}
                        changeValue={formatValue(Math.abs(stats.mdiChange))}
                        color="red"
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
                        title={`${selectedCoin?.symbol.toUpperCase()} ${t('adi.title', 'ADX')}`}
                        subtitle={t('adi.chartDescription', 'ADX measures trend strength, +DI and -DI measure trend direction')}
                        dateKey="date"
                        yAxisDomain={yAxisDomain}
                        tooltipContent={<CustomTooltip />}
                    />
                </div>
            </AnalysisPageLayout>

            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={t("indicators.adi.title")}
            >
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        {t("indicators.adi.description")}
                    </p>

                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                            {t("indicators.rsi.interpretation.title", "Interpretation")}
                        </h4>
                        <div className="grid gap-4">
                            {(t("indicators.adi.interpretation.levels", { returnObjects: true }) as any[]).map((level, i) => (
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
                                {t("indicators.adi.interpretation.buy_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.adi.interpretation.buy_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                {t("indicators.adi.interpretation.sell_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.adi.interpretation.sell_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {t("indicators.adi.warnings.title")}
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                            {(t("indicators.adi.warnings.items", { returnObjects: true }) as string[]).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                {t("indicators.adi.tip.title")}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {t("indicators.adi.tip.content")}
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default ADIPage
