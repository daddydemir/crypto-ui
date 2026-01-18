import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from "recharts"
import { TrendingUp, TrendingDown, Calendar, Maximize2 } from "lucide-react"
import { getBollingerBands, getBollingerBandSignals, type BollingerBandsPoint, type BollingerBandSignal } from "@/services/bollingerBandsService.ts"
import { getTopCoins, type Coin } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapBollingerToChartPoints } from "@/components/charts/types.ts"
import CoinSelector from "@/components/common/CoinSelector"

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

const BollingerBandsPage: React.FC = () => {
    const { t } = useTranslation()
    const [selectedCoin, setSelectedCoin] = useState<Coin>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)
    const [signalFilter, setSignalFilter] = useState<'all' | 'above' | 'below' | 'inside'>('all')

    const { data: coins } = useCachedData({
        cacheKey: 'top-coins',
        fetchFn: getTopCoins
    })

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<BollingerBandsPoint[]>({
        cacheKey: `bollinger-bands-${selectedCoin?.id}`,
        fetchFn: () => selectedCoin?.id ? getBollingerBands(selectedCoin.id) : Promise.resolve([])
    })

    const { data: signals, loading: signalsLoading, refresh: refreshSignals, lastUpdateText: signalsLastUpdate } = useCachedData<BollingerBandSignal[]>({
        cacheKey: 'bollinger-band-signals',
        fetchFn: getBollingerBandSignals
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

        const filtered = data.filter(item => new Date(item.Date) >= cutoffDate)

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
            upperBandCurrent: 0, upperBandChange: 0,
            ma20Current: 0, ma20Change: 0,
            lowerBandCurrent: 0, lowerBandChange: 0
        }

        const latest = filteredData[filteredData.length - 1]
        const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : latest

        return {
            upperBandCurrent: latest.UpperBand,
            upperBandChange: latest.UpperBand - previous.UpperBand,
            ma20Current: latest.MA20,
            ma20Change: latest.MA20 - previous.MA20,
            lowerBandCurrent: latest.LowerBand,
            lowerBandChange: latest.LowerBand - previous.LowerBand
        }
    }, [filteredData])

    const yAxisDomain = useMemo(() => {
        if (filteredData.length === 0) return ['auto', 'auto']

        const allValues = filteredData.flatMap(d => [d.UpperBand, d.MA20, d.LowerBand])
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
                        {new Date(data.Date).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                            Upper Band: ${formatPrice(data.UpperBand)}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            MA 20: ${formatPrice(data.MA20)}
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            Lower Band: ${formatPrice(data.LowerBand)}
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
                    data={mapBollingerToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='bollingerBands'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {t('bollingerBands.title', 'Bollinger Bands')}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {t('bollingerBands.description', 'View Bollinger Bands analysis for different cryptocurrencies')}
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
                            {error.message || t('bollingerBands.errorLoading', 'Failed to load Bollinger Bands data')}
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
                                    Upper Band ({t('common.current', 'Current')})
                                </div>
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    ${formatPrice(stats.upperBandCurrent)}
                                </div>
                                <div className={`text-sm mt-1 flex items-center gap-1 ${stats.upperBandChange > 0 ? 'text-green-600 dark:text-green-400' :
                                    stats.upperBandChange < 0 ? 'text-red-600 dark:text-red-400' :
                                        'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {stats.upperBandChange > 0 ? <TrendingUp className="w-4 h-4" /> :
                                        stats.upperBandChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                                    {stats.upperBandChange > 0 ? '+' : ''}${formatPrice(Math.abs(stats.upperBandChange))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    MA 20 ({t('common.current', 'Current')})
                                </div>
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    ${formatPrice(stats.ma20Current)}
                                </div>
                                <div className={`text-sm mt-1 flex items-center gap-1 ${stats.ma20Change > 0 ? 'text-green-600 dark:text-green-400' :
                                    stats.ma20Change < 0 ? 'text-red-600 dark:text-red-400' :
                                        'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {stats.ma20Change > 0 ? <TrendingUp className="w-4 h-4" /> :
                                        stats.ma20Change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                                    {stats.ma20Change > 0 ? '+' : ''}${formatPrice(Math.abs(stats.ma20Change))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    Lower Band ({t('common.current', 'Current')})
                                </div>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    ${formatPrice(stats.lowerBandCurrent)}
                                </div>
                                <div className={`text-sm mt-1 flex items-center gap-1 ${stats.lowerBandChange > 0 ? 'text-green-600 dark:text-green-400' :
                                    stats.lowerBandChange < 0 ? 'text-red-600 dark:text-red-400' :
                                        'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {stats.lowerBandChange > 0 ? <TrendingUp className="w-4 h-4" /> :
                                        stats.lowerBandChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                                    {stats.lowerBandChange > 0 ? '+' : ''}${formatPrice(Math.abs(stats.lowerBandChange))}
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 mb-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedCoin?.symbol.toUpperCase()} {t('bollingerBands.title', 'Bollinger Bands')}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('bollingerBands.chartDescription', 'Upper band, MA20, and lower band')}
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
                                            dataKey="Date"
                                            tickFormatter={formatXAxis}
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px' }}
                                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                                            domain={yAxisDomain}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                                        />
                                        {filteredData.length > 50 && (
                                            <Brush
                                                dataKey="Date"
                                                height={30}
                                                stroke="#3B82F6"
                                                tickFormatter={formatXAxis}
                                            />
                                        )}
                                        <Line
                                            type="monotone"
                                            dataKey="UpperBand"
                                            stroke="#EF4444"
                                            strokeWidth={2}
                                            name="Upper Band"
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="MA20"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            name="MA 20"
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="LowerBand"
                                            stroke="#10B981"
                                            strokeWidth={2}
                                            name="Lower Band"
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-96">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {t('common.noData', 'No Bollinger Bands data available for this coin')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Signals Section */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {t('bollingerBands.signals.title', 'Bollinger Band Signals')}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('bollingerBands.signals.description', 'Coins breaking out of Bollinger Bands')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                        {(['all', 'above', 'below', 'inside'] as const).map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => setSignalFilter(filter)}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition ${signalFilter === filter
                                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                                    }`}
                                            >
                                                {t(`bollingerBands.signals.filter.${filter}`, filter.charAt(0).toUpperCase() + filter.slice(1))}
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
                                        if (signalFilter === 'above') return signal.price > signal.point.UpperBand;
                                        if (signalFilter === 'below') return signal.price < signal.point.LowerBand;
                                        if (signalFilter === 'inside') return signal.price <= signal.point.UpperBand && signal.price >= signal.point.LowerBand;
                                        return true;
                                    }).map((signal) => (
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
                                                {signal.price > signal.point.UpperBand ? (
                                                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                                        {t('bollingerBands.signals.aboveUpper', 'Above Upper')}
                                                    </span>
                                                ) : signal.price < signal.point.LowerBand ? (
                                                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                                        {t('bollingerBands.signals.belowLower', 'Below Lower')}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 rounded-full">
                                                        {t('bollingerBands.signals.inside', 'Inside')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                                                <div>
                                                    <p className="text-gray-500">{t('bollingerBands.signals.upper', 'Upper')}</p>
                                                    <p className="font-medium text-red-600 dark:text-red-400">${formatPrice(signal.point.UpperBand)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">{t('bollingerBands.signals.ma20', 'MA20')}</p>
                                                    <p className="font-medium text-blue-600 dark:text-blue-400">${formatPrice(signal.point.MA20)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">{t('bollingerBands.signals.lower', 'Lower')}</p>
                                                    <p className="font-medium text-green-600 dark:text-green-400">${formatPrice(signal.point.LowerBand)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    {t('bollingerBands.signals.noSignals', 'No signals found at the moment.')}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default BollingerBandsPage