import React, { useMemo, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from "recharts"
import { TrendingUp, TrendingDown, Calendar, Maximize2 } from "lucide-react"
import { getATR, type ATRPoint } from "@/services/atrService"
import { getTopCoins } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapATRToChartPoints } from "@/components/charts/types"

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

const ATRPage: React.FC = () => {
    const { t } = useTranslation()
    const [selectedCoinId, setSelectedCoinId] = useState<string>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)

    const { data: coins, loading: coinsLoading } = useCachedData({
        cacheKey: 'top-coins',
        fetchFn: getTopCoins
    })

    useEffect(() => {
        if (coins && coins.length > 0 && !selectedCoinId) {
            setSelectedCoinId(coins[0].id)
        }
    }, [coins, selectedCoinId])

    const selectedCoin = coins?.find(c => c.id === selectedCoinId)

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<ATRPoint[]>({
        cacheKey: `atr-${selectedCoin?.symbol}`,
        fetchFn: () => selectedCoin?.symbol ? getATR(selectedCoin.symbol) : Promise.resolve([])
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
                sampleRate = 2
                break
            case '1y':
                cutoffDate.setFullYear(now.getFullYear() - 1)
                sampleRate = 7
                break
            case 'all':
                cutoffDate = new Date(0)
                sampleRate = Math.ceil(data.length / 200)
                break
        }

        const filtered = data.filter(item => new Date(item.Time) >= cutoffDate)

        if (sampleRate > 1) {
            return filtered.filter((_, index) => index % sampleRate === 0)
        }

        return filtered
    }, [data, timeRange])

    const yAxisDomain = useMemo(() => {
        if (filteredData.length === 0) return ['auto', 'auto']

        const allValues = filteredData.map(d => d.Point)
        const minValue = Math.min(...allValues)
        const maxValue = Math.max(...allValues)

        // Add 2% padding for better visualization
        const padding = (maxValue - minValue) * 0.02
        return [minValue - padding, maxValue + padding]
    }, [filteredData])

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
                    data={mapATRToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='atr'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {t('atr.title', 'Average True Range')}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {t('atr.description', 'View ATR volatility analysis for different cryptocurrencies')}
                            </p>
                        </div>

                        {selectedCoinId && (
                            <RefreshButton
                                onRefresh={refresh}
                                refreshing={refreshing}
                                disabled={loading}
                                lastUpdateText={lastUpdateText}
                            />
                        )}
                    </div>
                </div>

                {/* Coin Selection */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('common.selectCrypto', 'Select Cryptocurrency')}
                    </label>
                    {coinsLoading ? (
                        <div className="w-full md:w-96 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
                            {t('common.loadingCoins', 'Loading coins...')}
                        </div>
                    ) : (
                        <select
                            value={selectedCoinId}
                            onChange={(e) => setSelectedCoinId(e.target.value)}
                            className="w-full md:w-96 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                            {coins?.map((coin) => (
                                <option key={coin.id} value={coin.id}>
                                    {coin.symbol.toUpperCase()} - {coin.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                        <p className="text-red-600 dark:text-red-400">
                            {error.message || t('atr.errorLoading', 'Failed to load ATR data')}
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
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t('atr.current', 'Current ATR')}
                                </div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatPrice(stats.current)}
                                </div>
                                <div className={`text-sm mt-1 flex items-center gap-1 ${stats.change > 0 ? 'text-green-600 dark:text-green-400' :
                                    stats.change < 0 ? 'text-red-600 dark:text-red-400' :
                                        'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {stats.change > 0 ? <TrendingUp className="w-4 h-4" /> :
                                        stats.change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                                    {stats.change > 0 ? '+' : ''}{formatPrice(Math.abs(stats.change))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t('atr.highest', 'Highest')}
                                </div>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {formatPrice(stats.highest)}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t('atr.lowest', 'Lowest')}
                                </div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatPrice(stats.lowest)}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t('atr.average', 'Average')}
                                </div>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {formatPrice(stats.average)}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t('atr.range', 'Range')}
                                </div>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {formatPrice(stats.highest - stats.lowest)}
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 mb-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedCoin?.symbol.toUpperCase()} {t('atr.title', 'Average True Range')}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('atr.chartDescription', 'ATR measures market volatility')}
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
                                            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
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
                                            dataKey="Time"
                                            tickFormatter={formatXAxis}
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px' }}
                                            tickFormatter={(value) => formatPrice(value)}
                                            domain={yAxisDomain}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                                        />
                                        {filteredData.length > 50 && (
                                            <Brush
                                                dataKey="Time"
                                                height={30}
                                                stroke="#3B82F6"
                                                tickFormatter={formatXAxis}
                                            />
                                        )}
                                        <Line
                                            type="monotone"
                                            dataKey="Point"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            name="ATR"
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-96">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {t('common.noData', 'No ATR data available for this coin')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default ATRPage