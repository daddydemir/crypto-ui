import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts'
import { BarChart3, Maximize2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import TimeRangeSelector from './TimeRangeSelector'
import { type TimeRange } from '@/hooks/useTimeRangeFilter'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { downsample, formatAxisDate, formatCompactNumber } from '@/components/charts/chartUtils'

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
    const isMobile = useIsMobile()
    const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set())
    const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US'
    const chartData = useMemo(() => downsample(data, isMobile ? 180 : 600), [data, isMobile])

    const formatXAxis = (dateStr: string) => {
        return formatAxisDate(dateStr, locale, isMobile || timeRange === '7d' || timeRange === '30d')
    }

    return (
        <div className="chart-card surface-card min-w-0 overflow-hidden p-3 sm:p-6">
            <div className="mb-4 flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <div className="flex items-start gap-3"><span className="shrink-0 rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"><BarChart3 className="h-5 w-5" /></span><h2 className="min-w-0 break-words text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-xl">{title}</h2></div>
                    {subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="flex min-w-0 items-center gap-2">
                    <TimeRangeSelector
                        value={timeRange}
                        onChange={onTimeRangeChange}
                    />
                    {onFullScreen && (
                        <button
                            onClick={onFullScreen}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                            title={t('common.fullScreen', 'Full Screen')}
                        >
                            <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {data.length > 0 ? (
                <>
                <div className="chart-stage h-[270px] w-full min-w-0 sm:h-[380px] lg:h-[460px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 12, right: isMobile ? 4 : 12, left: isMobile ? -12 : 4, bottom: 4 }} accessibilityLayer>
                        <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                        <XAxis
                            dataKey={dateKey}
                            tickFormatter={formatXAxis}
                            axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }}
                            minTickGap={isMobile ? 48 : 32} tickCount={isMobile ? 4 : undefined}
                        />
                        <YAxis
                            axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} width={isMobile ? 52 : 72}
                            tickFormatter={isMobile ? (value) => formatCompactNumber(Number(value), locale) : yAxisFormatter}
                            domain={yAxisDomain}
                        />
                        <Tooltip content={tooltipContent} cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: 14, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', boxShadow: '0 18px 40px rgba(15,23,42,.22)' }} />
                        {showBrush && !isMobile && data.length > brushThreshold && (
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
                                hide={hiddenLines.has(line.dataKey)}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff' }}
                                isAnimationActive={!isMobile}
                                animationDuration={450}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer></div>
                <div className="chart-legend" aria-label={t('common.legend', 'Legend')}>
                    {lines.map((line) => <button key={line.dataKey} type="button" aria-pressed={!hiddenLines.has(line.dataKey)} onClick={() => setHiddenLines(current => { const next = new Set(current); if (next.has(line.dataKey)) next.delete(line.dataKey); else next.add(line.dataKey); return next })} className={hiddenLines.has(line.dataKey) ? 'is-hidden' : ''}><span style={{ backgroundColor: line.color }} />{line.name}</button>)}
                </div></>
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
