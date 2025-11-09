import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, X } from 'lucide-react'
import type { FullScreenChartProps, TimeRange } from '@/components/charts/types.ts'
import ApexChartWrapper from './ApexChartWrapper'

const FullScreenChart: React.FC<FullScreenChartProps> = ({
                                                             data,
                                                             timeRange,
                                                             coinSymbol,
                                                             onClose
                                                         }) => {
    const { t } = useTranslation()
    const [customTimeRange, setCustomTimeRange] = useState<TimeRange>(timeRange)

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return []

        const now = new Date()
        let cutoffDate = new Date()
        let sampleRate = 1

        switch (customTimeRange) {
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
                sampleRate = Math.ceil(data.length / 500)
                break
        }

        const filtered = data.filter(item => new Date(item.date) >= cutoffDate)

        if (sampleRate > 1) {
            return filtered.filter((_, index) => index % sampleRate === 0)
        }

        return filtered
    }, [data, customTimeRange])

    const timeRangeButtons: { value: TimeRange; label: string }[] = [
        { value: '7d', label: '7 ' + t('common.days', 'Days') },
        { value: '30d', label: '30 ' + t('common.days', 'Days') },
        { value: '90d', label: '90 ' + t('common.days', 'Days') },
        { value: '1y', label: '1 ' + t('common.year', 'Year') },
        { value: 'all', label: t('common.all', 'All') },
    ]

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-950 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {coinSymbol.toUpperCase()} {t('exponentialMovingAverages.title', 'Moving Averages')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('exponentialMovingAverages.fullScreenDescription', 'Full screen chart view with ApexCharts')}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div className="flex gap-1 flex-wrap">
                            {timeRangeButtons.map((btn) => (
                                <button
                                    key={btn.value}
                                    onClick={() => setCustomTimeRange(btn.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                        customTimeRange === btn.value
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                        title={t('common.close', 'Close')}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 p-6">
                {filteredData.length > 0 ? (
                    <ApexChartWrapper
                        data={filteredData}
                        timeRange={customTimeRange}
                        coinSymbol={coinSymbol}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400 text-xl">
                            {t('exponentialMovingAverages.noData', 'No moving average data available for this coin')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default FullScreenChart