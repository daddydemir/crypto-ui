import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { getMovingAverages, getMovingAverageSignals, type MovingAveragePoint, type MovingAverageSignal } from "@/services/movingAverageService"
import { getTopCoins, type Coin } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapMovingAverageToChartPoints } from "@/components/charts/types.ts"
import AnalysisPageLayout from "@/components/analyses/AnalysisPageLayout"
import StatCard from "@/components/analyses/StatCard"
import AnalysisChart from "@/components/analyses/AnalysisChart"
import { useTimeRangeFilter, type TimeRange } from "@/hooks/useTimeRangeFilter"

const MovingAveragePage: React.FC = () => {
    const { t } = useTranslation()
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)
    const [selectedCoin, setSelectedCoin] = useState<Coin>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [signalFilter, setSignalFilter] = useState<'all' | 'bullish' | 'bearish' | 'mixed'>('all')

    const { data: coins } = useCachedData({
        cacheKey: 'top-coins',
        fetchFn: getTopCoins
    })

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<MovingAveragePoint[]>({
        cacheKey: `moving-averages-${selectedCoin?.id}`,
        fetchFn: () => selectedCoin?.id ? getMovingAverages(selectedCoin.id) : Promise.resolve([])
    })

    const { data: signals, loading: signalsLoading, refresh: refreshSignals, lastUpdateText: signalsLastUpdate } = useCachedData<MovingAverageSignal[]>({
        cacheKey: 'moving-average-signals',
        fetchFn: getMovingAverageSignals
    })

    const filteredData = useTimeRangeFilter({
        data,
        timeRange,
        dateExtractor: (item) => item.date
    })

    const formatPrice = (value: number): string => {
        if (value >= 1) {
            return value.toFixed(2)
        }
        return value.toFixed(6)
    }

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
        { dataKey: 'ma99', name: 'MA 99', color: '#F97316' }
    ]

    return (
        <>
            {showFullScreenChart && data && selectedCoin && (
                <FullScreenChart
                    data={mapMovingAverageToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='movingAverages'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}

            <AnalysisPageLayout
                title={t('movingAverages.title', 'Moving Averages')}
                description={t('movingAverages.description', 'View moving average trends for different cryptocurrencies')}
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
                <div className="mb-6">
                    <AnalysisChart
                        data={filteredData}
                        lines={chartLines}
                        timeRange={timeRange}
                        onTimeRangeChange={setTimeRange}
                        onFullScreen={() => setShowFullScreenChart(true)}
                        title={`${selectedCoin?.symbol.toUpperCase()} ${t('movingAverages.title', 'Moving Averages')}`}
                        subtitle={t('movingAverages.chartDescription', '7-day, 25-day, and 99-day moving averages')}
                        dateKey="date"
                        yAxisDomain={yAxisDomain}
                        tooltipContent={<CustomTooltip />}
                    />
                </div>

                {/* Signals Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {t('movingAverages.signals.title', 'Moving Average Signals')}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('movingAverages.signals.description', 'Coins with Bullish or Bearish moving average trends')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                {(['all', 'bullish', 'bearish', 'mixed'] as const).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setSignalFilter(filter)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition ${signalFilter === filter
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {t(`movingAverages.signals.${filter === 'all' ? 'all' : filter}`, filter.charAt(0).toUpperCase() + filter.slice(1))}
                                    </button>
                                ))}
                            </div>
                            <RefreshButton
                                onRefresh={refreshSignals}
                                refreshing={false}
                                lastUpdateText={signalsLastUpdate}
                            />
                        </div>
                    </div>

                    {signalsLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : signals && signals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {signals.filter(signal => {
                                if (signalFilter === 'all') return true;
                                const latest = signal.points[signal.points.length - 1];
                                const isBullish = latest.ma7 > latest.ma25 && latest.ma25 > latest.ma99;
                                const isBearish = latest.ma7 < latest.ma25 && latest.ma25 < latest.ma99;

                                if (signalFilter === 'bullish') return isBullish;
                                if (signalFilter === 'bearish') return isBearish;
                                if (signalFilter === 'mixed') return !isBullish && !isBearish;
                                return true;
                            }).map((signal) => {
                                const latest = signal.points[signal.points.length - 1];
                                const isBullish = latest.ma7 > latest.ma25 && latest.ma25 > latest.ma99;
                                const isBearish = latest.ma7 < latest.ma25 && latest.ma25 < latest.ma99;

                                return (
                                    <div
                                        key={signal.id}
                                        onClick={() => {
                                            const coin = coins?.find(c => c.id === signal.id)
                                            if (coin) setSelectedCoin(coin)
                                        }}
                                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{signal.name} ({signal.symbol})</h3>
                                                <p className="text-sm text-gray-500">${formatPrice(signal.price)}</p>
                                            </div>
                                            {isBullish ? (
                                                <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                                    {t('movingAverages.signals.bullish', 'Bullish Trend')}
                                                </span>
                                            ) : isBearish ? (
                                                <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                                    {t('movingAverages.signals.bearish', 'Bearish Trend')}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 rounded-full">
                                                    {t('movingAverages.signals.mixed', 'Mixed')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                                            <div>
                                                <p className="text-gray-500">MA7</p>
                                                <p className="font-medium text-blue-600 dark:text-blue-400">${formatPrice(latest.ma7)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">MA25</p>
                                                <p className="font-medium text-green-600 dark:text-green-400">${formatPrice(latest.ma25)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">MA99</p>
                                                <p className="font-medium text-orange-600 dark:text-orange-400">${formatPrice(latest.ma99)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {t('movingAverages.signals.noSignals', 'No signals found at the moment.')}
                        </div>
                    )}
                </div>
            </AnalysisPageLayout>
        </>
    )
}

export default MovingAveragePage