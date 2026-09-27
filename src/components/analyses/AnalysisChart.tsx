import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts'
import { BarChart3, Maximize2 } from 'lucide-react'
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

function AnalysisChart<T extends object>({
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
    const { t, i18n } = useTranslation()

    const formatXAxis = (dateStr: string) => {
        const date = new Date(dateStr)
        if (timeRange === '7d' || timeRange === '30d') {
            return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' })
        }
        return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', year: '2-digit' })
    }

    return (
        <div className="surface-card overflow-hidden p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div>
                    <div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"><BarChart3 className="h-5 w-5" /></span><h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{title}</h2></div>
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
                <ResponsiveContainer width="100%" height={460}>
                    <LineChart data={data} margin={{ top: 16, right: 12, left: 4, bottom: 4 }}>
                        <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                        <XAxis
                            dataKey={dateKey}
                            tickFormatter={formatXAxis}
                            axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={72}
                            tickFormatter={yAxisFormatter}
                            domain={yAxisDomain}
                        />
                        <Tooltip content={tooltipContent} cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: 14, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', boxShadow: '0 18px 40px rgba(15,23,42,.22)' }} />
                        <Legend
                            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                        />
                        {showBrush && data.length > brushThreshold && (
                            <Brush
                                dataKey={dateKey}
                                height={30}
                                stroke="#6366f1" fill="#eef2ff"
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
                                activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff' }}
                                animationDuration={650}
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
