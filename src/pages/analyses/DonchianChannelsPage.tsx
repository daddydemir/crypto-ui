import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { getDonchianChannels, type DonchianChannelsPoint } from "@/services/donchianChannelsService.ts"
import { type Coin } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapDonchianToChartPoints } from "@/components/charts/types.ts"
import AnalysisPageLayout from "@/components/analyses/AnalysisPageLayout"
import StatCard from "@/components/analyses/StatCard"
import AnalysisChart from "@/components/analyses/AnalysisChart"
import { useTimeRangeFilter, type TimeRange } from "@/hooks/useTimeRangeFilter"

const DonchianChannelsPage: React.FC = () => {
    const { t } = useTranslation()
    const [selectedCoin, setSelectedCoin] = useState<Coin>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<DonchianChannelsPoint[]>({
        cacheKey: `donchian-channels-${selectedCoin?.symbol}`,
        fetchFn: () => selectedCoin?.symbol ? getDonchianChannels(selectedCoin.symbol) : Promise.resolve([])
    })

    const filteredData = useTimeRangeFilter({
        data,
        timeRange,
        dateExtractor: (item) => item.Date
    })

    const formatPrice = (value: number): string => {
        if (value >= 1) {
            return value.toFixed(2)
        }
        return value.toFixed(6)
    }

    const stats = useMemo(() => {
        if (filteredData.length === 0) return {
            upperCurrent: 0, upperChange: 0,
            middleCurrent: 0, middleChange: 0,
            lowerCurrent: 0, lowerChange: 0,
            priceCurrent: 0, priceChange: 0
        }

        const latest = filteredData[filteredData.length - 1]
        const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : latest

        return {
            upperCurrent: latest.Upper,
            upperChange: latest.Upper - previous.Upper,
            middleCurrent: latest.Middle,
            middleChange: latest.Middle - previous.Middle,
            lowerCurrent: latest.Lower,
            lowerChange: latest.Lower - previous.Lower,
            priceCurrent: latest.Price,
            priceChange: latest.Price - previous.Price
        }
    }, [filteredData])

    const yAxisDomain = useMemo(() => {
        if (filteredData.length === 0) return ['auto', 'auto'] as [string, string]

        const allValues = filteredData.flatMap(d => [d.Upper, d.Middle, d.Lower, d.Price])
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
                        {new Date(data.Date).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                            Upper: ${formatPrice(data.Upper)}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            Middle: ${formatPrice(data.Middle)}
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            Lower: ${formatPrice(data.Lower)}
                        </p>
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            Price: ${formatPrice(data.Price)}
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    const chartLines = [
        { dataKey: 'Upper', name: 'Upper Channel', color: '#EF4444' },
        { dataKey: 'Middle', name: 'Middle Line', color: '#3B82F6' },
        { dataKey: 'Lower', name: 'Lower Channel', color: '#10B981' },
        { dataKey: 'Price', name: 'Price', color: '#8B5CF6' }
    ]

    return (
        <>
            {showFullScreenChart && data && selectedCoin && (
                <FullScreenChart
                    data={mapDonchianToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='donchianChannels'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}

            <AnalysisPageLayout
                title={t('donchianChannels.title', 'Donchian Channels')}
                description={t('donchianChannels.description', 'View Donchian Channels analysis for different cryptocurrencies')}
                selectedCoin={selectedCoin}
                onCoinChange={setSelectedCoin}
                onRefresh={refresh}
                refreshing={refreshing}
                lastUpdateText={lastUpdateText}
                loading={loading}
                error={error}
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        label="Upper Channel"
                        value={`$${formatPrice(stats.upperCurrent)}`}
                        change={stats.upperChange}
                        changeValue={`$${formatPrice(Math.abs(stats.upperChange))}`}
                        color="red"
                    />
                    <StatCard
                        label="Middle Line"
                        value={`$${formatPrice(stats.middleCurrent)}`}
                        change={stats.middleChange}
                        changeValue={`$${formatPrice(Math.abs(stats.middleChange))}`}
                        color="blue"
                    />
                    <StatCard
                        label="Lower Channel"
                        value={`$${formatPrice(stats.lowerCurrent)}`}
                        change={stats.lowerChange}
                        changeValue={`$${formatPrice(Math.abs(stats.lowerChange))}`}
                        color="green"
                    />
                    <StatCard
                        label="Current Price"
                        value={`$${formatPrice(stats.priceCurrent)}`}
                        change={stats.priceChange}
                        changeValue={`$${formatPrice(Math.abs(stats.priceChange))}`}
                        color="blue"
                    />
                </div>

                {/* Chart */}
                <AnalysisChart
                    data={filteredData}
                    lines={chartLines}
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                    onFullScreen={() => setShowFullScreenChart(true)}
                    title={`${selectedCoin?.symbol.toUpperCase()} ${t('donchianChannels.title', 'Donchian Channels')}`}
                    subtitle={t('donchianChannels.chartDescription', 'Upper channel, middle line, lower channel and price')}
                    dateKey="Date"
                    yAxisFormatter={(value) => `$${value.toFixed(2)}`}
                    yAxisDomain={yAxisDomain}
                    tooltipContent={<CustomTooltip />}
                />
            </AnalysisPageLayout>
        </>
    )
}

export default DonchianChannelsPage
