import React, { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getRSIHistory } from "@/services/rsiService"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush } from "recharts"
import {ArrowLeft, TrendingUp, TrendingDown, Calendar, Maximize2} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx";
import {mapRsiToChartPoints} from "@/components/charts/types.ts";

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

const CoinDetailPage: React.FC = () => {
    const { coinId } = useParams<{ coinId: string }>()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)

    const { data, loading, refreshing, refresh, lastUpdateText } = useCachedData({
        cacheKey: `coin-detail-${coinId}`,
        fetchFn: () => getRSIHistory(coinId!)
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

    const formatCoinName = (coinId: string) => {
        return coinId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const currentRSI = filteredData.length > 0 ? filteredData[filteredData.length - 1].rsi : 0
    const previousRSI = filteredData.length > 1 ? filteredData[filteredData.length - 2].rsi : 0
    const rsiChange = currentRSI - previousRSI

    const stats = useMemo(() => {
        if (filteredData.length === 0) return { max: 0, min: 0, avg: 0 }

        const rsiValues = filteredData.map(d => d.rsi)
        return {
            max: Math.max(...rsiValues),
            min: Math.min(...rsiValues),
            avg: rsiValues.reduce((a, b) => a + b, 0) / rsiValues.length
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
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {new Date(data.date).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                    <p className={`text-lg font-bold ${
                        data.rsi >= 70 ? 'text-red-600' : 
                        data.rsi <= 30 ? 'text-green-600' : 
                        'text-blue-600'
                    }`}>
                        RSI: {data.rsi.toFixed(2)}
                    </p>
                </div>
            )
        }
        return null
    }

    const timeRangeButtons: { value: TimeRange; label: string }[] = [
        { value: '7d', label: t('rsi.timeRange.7d') },
        { value: '30d', label: t('rsi.timeRange.30d') },
        { value: '90d', label: t('rsi.timeRange.90d') },
        { value: '1y', label: t('rsi.timeRange.1y') },
        { value: 'all', label: t('rsi.timeRange.all') },
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            {showFullScreenChart && data && coinId && (
                <FullScreenChart
                    data={mapRsiToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={coinId}
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            {t("common.back", "Back")}
                        </button>
                        
                        <RefreshButton
                            onRefresh={refresh}
                            refreshing={refreshing}
                            disabled={loading}
                            lastUpdateText={lastUpdateText}
                        />
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {coinId && formatCoinName(coinId)}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        RSI {t("common.history", "History")}
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t("rsi.currentRSI", "Current RSI")}
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {currentRSI.toFixed(2)}
                                </div>
                                <div className={`text-sm mt-1 flex items-center gap-1 ${
                                    rsiChange > 0 ? 'text-green-600 dark:text-green-400' : 
                                    rsiChange < 0 ? 'text-red-600 dark:text-red-400' : 
                                    'text-gray-600 dark:text-gray-400'
                                }`}>
                                    {rsiChange > 0 ? <TrendingUp className="w-4 h-4" /> :
                                     rsiChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                                    {rsiChange > 0 ? '+' : ''}{rsiChange.toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t("rsi.highest", "Highest")}
                                </div>
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    {stats.max.toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t("rsi.lowest", "Lowest")}
                                </div>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {stats.min.toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t("rsi.average", "Average")}
                                </div>
                                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                                    {stats.avg.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        RSI {t("common.chart", "Chart")}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {filteredData.length} {t("rsi.dataPoints")}
                                    </p>
                                </div>

                                {/* Time Range Selector */}
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    {timeRangeButtons.map((btn) => (
                                        <button
                                            key={btn.value}
                                            onClick={() => setTimeRange(btn.value)}
                                            className={`px-3 py-1.5 text-sm rounded-lg transition ${
                                                timeRange === btn.value
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

                            {filteredData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={450}>
                                    <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatXAxis}
                                            stroke="#9CA3AF"
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            interval="preserveStartEnd"
                                            minTickGap={50}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            stroke="#9CA3AF"
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <ReferenceLine
                                            y={70}
                                            stroke="#EF4444"
                                            strokeDasharray="3 3"
                                            label={{ value: t("rsi.overbought"), fill: '#EF4444', fontSize: 11 }}
                                        />
                                        <ReferenceLine
                                            y={30}
                                            stroke="#10B981"
                                            strokeDasharray="3 3"
                                            label={{ value: t("rsi.oversold"), fill: '#10B981', fontSize: 11 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="rsi"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            dot={false} // Dot'ları kaldır - performans için
                                            activeDot={{ r: 5, fill: '#3B82F6' }}
                                            isAnimationActive={false}
                                        />
                                        {/* Brush - Zoom ve kaydırma için */}
                                        {filteredData.length > 50 && (
                                            <Brush
                                                dataKey="date"
                                                height={30}
                                                stroke="#3B82F6"
                                                fill="rgba(59, 130, 246, 0.1)"
                                            />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-96 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    {t("common.noData", "No data available")}
                                </div>
                            )}

                            {/* Legend */}
                            <div className="flex gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                                    <span>{t("rsi.legend.overbought")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                    <span>{t("rsi.legend.normal")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                                    <span>{t("rsi.legend.oversold")}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default CoinDetailPage