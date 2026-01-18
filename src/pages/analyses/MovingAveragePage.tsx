import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from "recharts"
import { TrendingUp, TrendingDown, Calendar, Maximize2 } from "lucide-react"

import { getMovingAverages, getMovingAverageSignals, type MovingAveragePoint, type MovingAverageSignal } from "@/services/movingAverageService"
import { getTopCoins, type Coin } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapMovingAverageToChartPoints } from "@/components/charts/types.ts"
import CoinSelector from "@/components/common/CoinSelector"

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

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

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return []

        const now = new Date()
        let cutoffDate = new Date()
        let sampleRate = 1

        switch (timeRange) {
            case '7d':
                cutoffDate.setDate(now.getDate() - 7)
                sampleRate = 1
                break
            case '30d':
                cutoffDate.setDate(now.getDate() - 30)
                sampleRate = 1
                break
            case '90d':
                cutoffDate.setDate(now.getDate() - 90)
                sampleRate = 1
                break
            case '1y':
                cutoffDate.setFullYear(now.getFullYear() - 1)
                sampleRate = 1
                break
            case 'all':
                cutoffDate = new Date(0)
                sampleRate = Math.ceil(data.length / 1000)
                break
        }

        const filtered = data.filter(item => new Date(item.date) >= cutoffDate)

        if (sampleRate > 1) {
            return filtered.filter((_, index) => index % sampleRate === 0)
        }

        return filtered
    }, [data, timeRange])

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
        if (filteredData.length === 0) return ['auto', 'auto']

        const allValues = filteredData.flatMap(d => [d.ma7, d.ma25, d.ma99])
        const minValue = Math.min(...allValues)
        const maxValue = Math.max(...allValues)

        // Add 2% padding for better visualization
        const padding = (maxValue - minValue) * 0.02
        return [minValue - padding, maxValue + padding]
    }, [filteredData])

    const formatXAxis = (dateStr: string) => {
        const date = new Date(dateStr)
        if (timeRange === '7d' || timeRange === '30d') {
            return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
        }
        return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
    }

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

    const timeRangeButtons: { value: TimeRange; label: string }[] = [
        { value: '7d', label: '7 ' + t('common.days', 'Days') },
        { value: '30d', label: '30 ' + t('common.days', 'Days') },
        { value: '90d', label: '90 ' + t('common.days', 'Days') },
        { value: '1y', label: '1 ' + t('common.year', 'Year') },
        { value: 'all', label: t('common.all', 'All') },
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            {showFullScreenChart && data && selectedCoin && (
                <FullScreenChart
                    data={mapMovingAverageToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='movingAverages'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {t('movingAverages.title', 'Moving Averages')}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {t('movingAverages.description', 'View moving average trends for different cryptocurrencies')}
                            </p>
                        </div>

                        {selectedCoin && (
                            <RefreshButton
                                onRefresh={refresh}
                                refreshing={refreshing}
                                disabled={loading}
                                lastUpdateText={lastUpdateText}
                            />
                        )}
                    </div>
                </div>

                <CoinSelector
                    value={selectedCoin?.id}
                    onChange={setSelectedCoin}
                />

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                        <p className="text-red-600 dark:text-red-400">
                            {error.message || t('movingAverages.errorLoading', 'Failed to load moving averages data')}
                        </p>
                    </div>
                )}

                {loading && !data ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    MA 7 ({t('common.current', 'Current')})
                                </div>
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    ${stats.ma7Current.toFixed(2)}
                                </div>
                                <div className={`text-sm mt-1 flex items-center gap-1 ${stats.ma7Change > 0 ? 'text-green-600 dark:text-green-400' :
                                    stats.ma7Change < 0 ? 'text-red-600 dark:text-red-400' :
                                        'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {stats.ma7Change > 0 ? <TrendingUp className="w-4 h-4" /> :
                                        stats.ma7Change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                                    {stats.ma7Change > 0 ? '+' : ''}${stats.ma7Change.toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    MA 25 ({t('common.current', 'Current')})
                                </div>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    ${stats.ma25Current.toFixed(2)}
                                </div>
                                <div className={`text-sm mt-1 flex items-center gap-1 ${stats.ma25Change > 0 ? 'text-green-600 dark:text-green-400' :
                                    stats.ma25Change < 0 ? 'text-red-600 dark:text-red-400' :
                                        'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {stats.ma25Change > 0 ? <TrendingUp className="w-4 h-4" /> :
                                        stats.ma25Change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                                    {stats.ma25Change > 0 ? '+' : ''}${stats.ma25Change.toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    MA 99 ({t('common.current', 'Current')})
                                </div>
                                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                    ${stats.ma99Current.toFixed(2)}
                                </div>
                                <div className={`text-sm mt-1 flex items-center gap-1 ${stats.ma99Change > 0 ? 'text-green-600 dark:text-green-400' :
                                    stats.ma99Change < 0 ? 'text-red-600 dark:text-red-400' :
                                        'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {stats.ma99Change > 0 ? <TrendingUp className="w-4 h-4" /> :
                                        stats.ma99Change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                                    {stats.ma99Change > 0 ? '+' : ''}${stats.ma99Change.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 mb-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedCoin?.symbol.toUpperCase()} {t('movingAverages.title', 'Moving Averages')}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('movingAverages.chartDescription', '7-day, 25-day, and 99-day moving averages')}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div className="flex gap-1 flex-wrap">
                                        {timeRangeButtons.map((btn) => (
                                            <button
                                                key={btn.value}
                                                onClick={() => setTimeRange(btn.value)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${timeRange === btn.value
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setShowFullScreenChart(true)}
                                            className="top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition z-10"
                                            title={t('common.fullScreen', 'Full Screen')}
                                        >
                                            <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {filteredData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={500}>
                                    <LineChart data={filteredData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatXAxis}
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px' }}
                                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                                            domain={yAxisDomain}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                                        />
                                        {filteredData.length > 50 && (
                                            <Brush
                                                dataKey="date"
                                                height={30}
                                                stroke="#3B82F6"
                                                tickFormatter={formatXAxis}
                                            />
                                        )}
                                        <Line
                                            type="monotone"
                                            dataKey="ma7"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            name="MA 7"
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="ma25"
                                            stroke="#10B981"
                                            strokeWidth={2}
                                            name="MA 25"
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="ma99"
                                            stroke="#F97316"
                                            strokeWidth={2}
                                            name="MA 99"
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-96">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {t('movingAverages.noData', 'No moving average data available for this coin')}
                                    </p>
                                </div>
                            )}
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
                                        // Trend Logic: 
                                        // Bullish: MA7 > MA25 > MA99
                                        // Bearish: MA7 < MA25 < MA99
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
                    </>
                )}
            </div>
        </div>
    )
}

export default MovingAveragePage