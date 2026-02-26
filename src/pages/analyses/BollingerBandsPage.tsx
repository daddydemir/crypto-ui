import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Info, TrendingUp, TrendingDown, Activity } from "lucide-react"
import Modal from "@/components/common/Modal"
import { getBollingerBands, getBollingerBandSignals, type BollingerBandsPoint, type BollingerBandSignal } from "@/services/bollingerBandsService.ts"
import { getTopCoins, type Coin } from "@/services/coinService"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import FullScreenChart from "@/components/charts/FullScreenChart.tsx"
import { mapBollingerToChartPoints } from "@/components/charts/types.ts"
import AnalysisPageLayout from "@/components/analyses/AnalysisPageLayout"
import StatCard from "@/components/analyses/StatCard"
import AnalysisChart from "@/components/analyses/AnalysisChart"
import { useTimeRangeFilter, type TimeRange } from "@/hooks/useTimeRangeFilter"

const BollingerBandsPage: React.FC = () => {
    const { t } = useTranslation()
    const [selectedCoin, setSelectedCoin] = useState<Coin>()
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [showFullScreenChart, setShowFullScreenChart] = useState(false)
    const [signalFilter, setSignalFilter] = useState<'all' | 'above' | 'below' | 'inside'>('all')
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const { data: coins } = useCachedData({
        cacheKey: 'top-coins',
        fetchFn: getTopCoins
    })

    const { data, loading, refreshing, refresh, lastUpdateText, error } = useCachedData<BollingerBandsPoint[]>({
        cacheKey: `bollinger-bands-${selectedCoin?.symbol}`,
        fetchFn: () => selectedCoin?.symbol ? getBollingerBands(selectedCoin.symbol) : Promise.resolve([])
    })

    const { data: signals, loading: signalsLoading, refresh: refreshSignals, lastUpdateText: signalsLastUpdate } = useCachedData<BollingerBandSignal[]>({
        cacheKey: 'bollinger-band-signals',
        fetchFn: getBollingerBandSignals
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
        if (filteredData.length === 0) return ['auto', 'auto'] as [string, string]

        const allValues = filteredData.flatMap(d => [d.UpperBand, d.MA20, d.LowerBand])
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
                        <p className="text-sm font-semibold text-amber-500 dark:text-amber-400">
                            Price: ${formatPrice(data.Price)}
                        </p>
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

    const chartLines = [
        { dataKey: 'UpperBand', name: 'Upper Band', color: '#EF4444' },
        { dataKey: 'MA20', name: 'MA 20', color: '#3B82F6' },
        { dataKey: 'LowerBand', name: 'Lower Band', color: '#10B981' },
        { dataKey: 'Price', name: 'Price', color: '#F59E0B' }
    ]

    return (
        <>
            {showFullScreenChart && data && selectedCoin && (
                <FullScreenChart
                    data={mapBollingerToChartPoints(data)}
                    timeRange={timeRange}
                    coinSymbol={selectedCoin.symbol}
                    analyseType='bollingerBands'
                    onClose={() => setShowFullScreenChart(false)}
                />
            )}

            <AnalysisPageLayout
                title={t('bollingerBands.title', 'Bollinger Bands')}
                headerContent={
                    <button
                        onClick={() => setIsDetailOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        <Info className="w-4 h-4" />
                        {t("indicators.detail", "Detail")}
                    </button>
                }
                description={t('bollingerBands.description', 'View Bollinger Bands analysis for different cryptocurrencies')}
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
                        label={`Upper Band (${t('common.current', 'Current')})`}
                        value={`$${formatPrice(stats.upperBandCurrent)}`}
                        change={stats.upperBandChange}
                        changeValue={`$${formatPrice(Math.abs(stats.upperBandChange))}`}
                        color="red"
                    />
                    <StatCard
                        label={`MA 20 (${t('common.current', 'Current')})`}
                        value={`$${formatPrice(stats.ma20Current)}`}
                        change={stats.ma20Change}
                        changeValue={`$${formatPrice(Math.abs(stats.ma20Change))}`}
                        color="blue"
                    />
                    <StatCard
                        label={`Lower Band (${t('common.current', 'Current')})`}
                        value={`$${formatPrice(stats.lowerBandCurrent)}`}
                        change={stats.lowerBandChange}
                        changeValue={`$${formatPrice(Math.abs(stats.lowerBandChange))}`}
                        color="green"
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
                        title={`${selectedCoin?.symbol.toUpperCase()} ${t('bollingerBands.title', 'Bollinger Bands')}`}
                        subtitle={t('bollingerBands.chartDescription', 'Upper band, MA20, and lower band')}
                        dateKey="Date"
                        yAxisFormatter={(value) => `$${value.toFixed(2)}`}
                        yAxisDomain={yAxisDomain}
                        tooltipContent={<CustomTooltip />}
                    />
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
            </AnalysisPageLayout>

            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={t("indicators.bollinger_bands.title")}
            >
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        {t("indicators.bollinger_bands.description")}
                    </p>

                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                            {t("indicators.rsi.interpretation.title", "Interpretation")}
                        </h4>
                        <div className="grid gap-4">
                            {(t("indicators.bollinger_bands.interpretation.levels", { returnObjects: true }) as any[]).map((level, i) => (
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
                                {t("indicators.bollinger_bands.interpretation.buy_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.bollinger_bands.interpretation.buy_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                {t("indicators.bollinger_bands.interpretation.sell_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.bollinger_bands.interpretation.sell_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {t("indicators.bollinger_bands.warnings.title")}
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                            {(t("indicators.bollinger_bands.warnings.items", { returnObjects: true }) as string[]).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                {t("indicators.bollinger_bands.tip.title")}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {t("indicators.bollinger_bands.tip.content")}
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default BollingerBandsPage