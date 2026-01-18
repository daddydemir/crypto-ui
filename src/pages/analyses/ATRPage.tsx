import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
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
        </>
    )
}

export default ATRPage