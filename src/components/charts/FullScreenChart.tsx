import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, X } from 'lucide-react'
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { FullScreenChartProps, TimeRange } from '@/components/charts/types.ts'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const chartColors = [
    { border: '#6366f1', background: 'rgba(99, 102, 241, 0.14)' },
    { border: '#10b981', background: 'rgba(16, 185, 129, 0.12)' },
    { border: '#f97316', background: 'rgba(249, 115, 22, 0.12)' },
    { border: '#a855f7', background: 'rgba(168, 85, 247, 0.12)' },
    { border: '#f43f5e', background: 'rgba(244, 63, 94, 0.12)' },
    { border: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)' },
]

const FullScreenChart: React.FC<FullScreenChartProps> = ({
    data,
    timeRange,
    coinSymbol,
    analyseType,
    onClose
}) => {
    const { t, i18n } = useTranslation()
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
                sampleRate = 1
                break
            case '1y':
                cutoffDate.setFullYear(now.getFullYear() - 1)
                sampleRate = 1
                break
            case 'all':
                cutoffDate = new Date(0)
                sampleRate = 1
                break
        }

        const filtered = data.filter(item => new Date(item.date) >= cutoffDate)

        if (sampleRate > 1) {
            return filtered.filter((_, index) => index % sampleRate === 0)
        }

        return filtered
    }, [data, customTimeRange])

    const seriesKeys = useMemo(() => {
        const keys = new Set<string>()

        filteredData.forEach((point) => {
            if (point.y !== undefined && point.y !== null) keys.add('value')
            Object.keys(point.series ?? {}).forEach((key) => keys.add(key))
        })

        return Array.from(keys)
    }, [filteredData])

    const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US'
    const numberFormatter = useMemo(
        () => new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }),
        [locale]
    )

    const chartData = useMemo<ChartData<'line'>>(() => ({
        labels: filteredData.map((point) => new Date(point.date).toLocaleDateString(locale, {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
        })),
        datasets: seriesKeys.map((key, index) => {
            const color = chartColors[index % chartColors.length]
            return {
                label: key === 'value' ? coinSymbol.toUpperCase() : key,
                data: filteredData.map((point) => (
                    key === 'value' ? point.y ?? null : point.series?.[key] ?? null
                )),
                borderColor: color.border,
                backgroundColor: color.background,
                borderWidth: 2.5,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 3,
                tension: 0.35,
                spanGaps: true,
                fill: false,
            }
        }),
    }), [coinSymbol, filteredData, locale, seriesKeys])

    const chartOptions = useMemo<ChartOptions<'line'>>(() => ({
        responsive: true,
        maintainAspectRatio: false,
        normalized: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        animation: {
            duration: 450,
        },
        plugins: {
            legend: {
                display: seriesKeys.length > 1,
                position: 'top',
                align: 'start',
                labels: {
                    color: '#94a3b8',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 8,
                    boxHeight: 8,
                    padding: 18,
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(148, 163, 184, 0.24)',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: (context) => {
                        const value = context.parsed.y
                        return `${context.dataset.label}: ${value === null ? '-' : numberFormatter.format(value)}`
                    },
                },
            },
        },
        scales: {
            x: {
                border: { display: false },
                grid: { display: false },
                ticks: {
                    color: '#94a3b8',
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 10,
                },
            },
            y: {
                border: { display: false },
                grid: { color: 'rgba(148, 163, 184, 0.14)' },
                ticks: {
                    color: '#94a3b8',
                    callback: (value) => numberFormatter.format(Number(value)),
                },
            },
        },
    }), [numberFormatter, seriesKeys.length])

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
                        {coinSymbol.toUpperCase()} - {t(`${analyseType}.title`, 'Moving Averages')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t(`${analyseType}.description`, 'Full screen chart view')}
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
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${customTimeRange === btn.value
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
            <div className="flex-1 min-h-0 p-6">
                {filteredData.length > 0 ? (
                    <div className="h-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <Line data={chartData} options={chartOptions} />
                    </div>
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
