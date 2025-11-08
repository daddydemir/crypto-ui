import React, { useMemo, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from "recharts"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"

import { getTopCoins } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import {getMovingAverages, type MovingAveragePoint} from "@/services/exponentialMAService.ts";

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

const ExponentialMAPage: React.FC = () => {
    const { t } = useTranslation()
    const [selectedCoinId, setSelectedCoinId] = useState<string>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')

    const { data: coins, loading: coinsLoading } = useCachedData({
        cacheKey: 'top-coins',
        fetchFn: getTopCoins
    })

    useEffect(() => {
        if (coins && coins.length > 0 && !selectedCoinId) {
            setSelectedCoinId(coins[0].id)
        }
    }, [coins, selectedCoinId])

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<MovingAveragePoint[]>({
        cacheKey: `exponential-moving-averages-${selectedCoinId}`,
        fetchFn: () => selectedCoinId ? getMovingAverages(selectedCoinId) : Promise.resolve([])
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

        const filtered = data.filter(item => new Date(item.date) >= cutoffDate)

        if (sampleRate > 1) {
            return filtered.filter((_, index) => index % sampleRate === 0)
        }

        return filtered
    }, [data, timeRange])

    const selectedCoin = coins?.find(c => c.id === selectedCoinId)

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
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {t('exponentialMovingAverages.title', 'Moving Averages')}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {t('exponentialMovingAverages.description', 'View moving average trends for different cryptocurrencies')}
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
                            {error.message || t('exponentialMovingAverages.errorLoading', 'Failed to load moving averages data')}
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
                                <div className={`text-sm mt-1 flex items-center gap-1 ${
                                    stats.ma7Change > 0 ? 'text-green-600 dark:text-green-400' :
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
                                <div className={`text-sm mt-1 flex items-center gap-1 ${
                                    stats.ma25Change > 0 ? 'text-green-600 dark:text-green-400' :
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
                                <div className={`text-sm mt-1 flex items-center gap-1 ${
                                    stats.ma99Change > 0 ? 'text-green-600 dark:text-green-400' :
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
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedCoin?.symbol.toUpperCase()} {t('exponentialMovingAverages.title', 'Moving Averages')}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('exponentialMovingAverages.chartDescription', '7-day, 25-day, and 99-day moving averages')}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div className="flex gap-1 flex-wrap">
                                        {timeRangeButtons.map((btn) => (
                                            <button
                                                key={btn.value}
                                                onClick={() => setTimeRange(btn.value)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                                    timeRange === btn.value
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
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
                                        {t('exponentialMovingAverages.noData', 'No moving average data available for this coin')}
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

export default ExponentialMAPage