import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts'
import { Maximize2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import TimeRangeSelector from './TimeRangeSelector'
import { type TimeRange } from '@/hooks/useTimeRangeFilter'

export interface ChartLine {
    dataKey: string
    name: string
    color: string
    strokeWidth?: number
}

interface AnalysisChartProps<T> {
    data: T[]
    lines: ChartLine[]
    timeRange: TimeRange
    onTimeRangeChange: (range: TimeRange) => void
    onFullScreen?: () => void
    title: string
    subtitle?: string
    dateKey: string
    yAxisFormatter?: (value: number) => string
    tooltipContent?: React.ReactElement
    yAxisDomain?: [number | string, number | string]
    showBrush?: boolean
    brushThreshold?: number
}

function AnalysisChart<T extends Record<string, any>>({
    data,
    lines,
    timeRange,
    onTimeRangeChange,
    onFullScreen,
    title,
    subtitle,
    dateKey,
    yAxisFormatter = (value) => `$${value.toFixed(0)}`,
    tooltipContent,
    yAxisDomain = ['auto', 'auto'],
    showBrush = true,
    brushThreshold = 50
}: AnalysisChartProps<T>) {
    const { t } = useTranslation()

    const formatXAxis = (dateStr: string) => {
        const date = new Date(dateStr)
        if (timeRange === '7d' || timeRange === '30d') {
            return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
        }
        return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <TimeRangeSelector
                        value={timeRange}
                        onChange={onTimeRangeChange}
                    />
                    {onFullScreen && (
                        <button
                            onClick={onFullScreen}
                            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                            title={t('common.fullScreen', 'Full Screen')}
                        >
                            <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={500}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                        <XAxis
                            dataKey={dateKey}
                            tickFormatter={formatXAxis}
                            stroke="#9CA3AF"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            style={{ fontSize: '12px' }}
                            tickFormatter={yAxisFormatter}
                            domain={yAxisDomain}
                        />
                        <Tooltip content={tooltipContent} />
                        <Legend
                            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                        />
                        {showBrush && data.length > brushThreshold && (
                            <Brush
                                dataKey={dateKey}
                                height={30}
                                stroke="#3B82F6"
                                tickFormatter={formatXAxis}
                            />
                        )}
                        {lines.map((line) => (
                            <Line
                                key={line.dataKey}
                                type="monotone"
                                dataKey={line.dataKey}
                                stroke={line.color}
                                strokeWidth={line.strokeWidth || 2}
                                name={line.name}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-96">
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('common.noData', 'No data available')}
                    </p>
                </div>
            )}
        </div>
    )
}

export default AnalysisChart
