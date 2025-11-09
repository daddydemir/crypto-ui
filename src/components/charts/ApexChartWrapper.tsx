// typescript
import React, {useMemo} from 'react'
import Chart from 'react-apexcharts'
import { type ApexOptions } from 'apexcharts'
import type {ChartPoint, TimeRange} from '@/components/charts/types.ts'

interface ApexChartWrapperProps {
    data: ChartPoint[]
    timeRange: TimeRange
    coinSymbol: string,
    seriesKeys?: string[]
}
const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F97316', '#A78BFA', '#F43F5E', '#06B6D4']

const ApexChartWrapper: React.FC<ApexChartWrapperProps> = ({data, seriesKeys: providedKeys = []}) => {
    const keys = useMemo<string[]>(() => {
        if (providedKeys && providedKeys.length > 0) return providedKeys

        if (!data || data.length === 0) return []

        const includeY = data.some(d => d.y !== undefined && d.y !== null)
        const firstWithSeries = data.find(d => d.series && Object.keys(d.series).length > 0)
        const seriesKeys = firstWithSeries ? Object.keys(firstWithSeries.series as Record<string, number | null>) : []
        return includeY ? ['y', ...seriesKeys] : seriesKeys
    }, [data, providedKeys])

    const series = useMemo(() => {
        return keys.map((key) => ({
            name: key === 'y' ? 'Value' : key,
            data: data.map(d => ({
                x: new Date(d.date).getTime(),
                y: key === 'y' ? (d.y ?? null) : (d.series?.[key] ?? null)
            }))
        }))
    }, [data, keys])

    const colors = DEFAULT_COLORS.slice(0, Math.max(series.length, DEFAULT_COLORS.length))

    const chartOptions: ApexOptions = {
        chart: {
            type: 'line',
            height: '100%',
            zoom: {enabled: true, type: 'x', autoScaleYaxis: true},
            toolbar: {
                show: false,
                tools: {download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true}
            },
            animations: {enabled: true, speed: 800,
                animateGradually: {enabled: true, delay: 150},
                dynamicAnimation: {enabled: true, speed: 350}
            }
        },
        stroke: {curve: 'smooth', width: 3, lineCap: 'round'},
        colors,
        xaxis: {
            type: 'datetime',
            labels: {
                datetimeFormatter: {
                    year: 'yyyy',
                    month: "MMM 'yy",
                    day: 'dd MMM',
                    hour: 'HH:mm'
                }
            },
            tooltip: {enabled: false}
        },
        yaxis: {
            labels: {
                formatter: function(value: number) {
                    return `$${value.toFixed(2)}`
                }
            },
            tooltip: {enabled: true}
        },
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'dark',
            x: {format: 'dd MMM yyyy'},
            custom: function({ series: s , dataPointIndex, w }) {

                const xVal = (w.globals.seriesX && w.globals.seriesX[0] && w.globals.seriesX[0][dataPointIndex])
                    || (w.globals.seriesX && w.globals.seriesX[dataPointIndex])
                const date = new Date(xVal)
                const formattedDate = date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })

                let rows = ''
                for (let i = 0; i < s.length; i++) {
                    const val = s[i][dataPointIndex]
                    const label = (series[i] && series[i].name) || `Series ${i + 1}`
                    const display = (val === null || val === undefined) ? '-' : `$${Number(val).toFixed(2)}`
                    const colorClass = ['text-blue-400','text-green-400','text-orange-400','text-purple-400','text-red-400','text-cyan-400'][i] || 'text-gray-300'
                    rows += `
                      <div class="flex items-center justify-between">
                        <span class="${colorClass} font-medium">${label}:</span>
                        <span class="text-white font-bold">${display}</span>
                      </div>
                    `
                }

                return `
                  <div class="apexcharts-tooltip-container">
                    <div class="bg-gray-900 dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
                      <div class="text-sm text-gray-300 mb-2">${formattedDate}</div>
                      <div class="space-y-1">${rows}</div>
                    </div>
                  </div>
                `
            }
        },
        legend: {position: 'top', horizontalAlign: 'right', fontSize: '14px', fontFamily: 'Inter, sans-serif',},
        grid: {
            borderColor: '#374151',
            strokeDashArray: 4,
            padding: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            }
        },
        markers: {
            size: 0,
            hover: {
                size: 5
            }
        },
        responsive: [
            {
                breakpoint: 768,
                options: {
                    legend: {
                        position: 'bottom',
                        horizontalAlign: 'center'
                    }
                }
            }
        ]
    }

    return (
        <Chart
            options={chartOptions}
            series={series}
            type="line"
            height="100%"
        />
    )
}

export default ApexChartWrapper
