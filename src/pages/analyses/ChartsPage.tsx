import React, { useMemo, useState, useCallback, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Maximize2, Minimize2 } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface ChartElement {
  index: number
}

const ChartsPage: React.FC = () => {
    const { t } = useTranslation()
    const [csvData, setCsvData] = useState("2023-10-01, 25000\n2023-10-02, 25500\n2023-10-03, 24800\n2023-10-04, 26000\n2023-10-05, 26500")
    const [signalDates, setSignalDates] = useState("2023-10-03")
    const [signalDates2, setSignalDates2] = useState("")
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [activeSignalSet, setActiveSignalSet] = useState<1 | 2>(1)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleChartHover = useCallback((elements: ChartElement[]) => {
        const newIndex = elements.length > 0 ? elements[0].index : null
        setHoveredIndex(prev => {
            if (prev === newIndex) return prev
            return newIndex
        })
    }, [])

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    const parsedData = useMemo(() => {
        return csvData
            .split('\n')
            .map(line => {
                if (!line.trim()) return null
                const parts = line.split(',')
                if (parts.length < 2) return null
                const date = parts[0].trim()
                const price = parseFloat(parts[1].trim())
                if (!date || isNaN(price)) return null
                return { date, price }
            })
            .filter(Boolean) as Array<{ date: string; price: number }>
    }, [csvData])

    const parsedSignalDates = useMemo(() => {
        return new Set(
            signalDates
                .split('\n')
                .map(d => d.trim())
                .filter(Boolean)
        )
    }, [signalDates])

    const parsedSignalDates2 = useMemo(() => {
        return new Set(
            signalDates2
                .split('\n')
                .map(d => d.trim())
                .filter(Boolean)
        )
    }, [signalDates2])

     
    const handleChartClick = useCallback((elements: ChartElement[]) => {
        if (elements.length > 0) {
            const clickedIndex = elements[0].index
            const clickedDate = parsedData[clickedIndex]?.date
            
            if (clickedDate) {
                if (activeSignalSet === 1) {
                    if (parsedSignalDates.has(clickedDate)) {
                        const updatedDates = signalDates
                            .split('\n')
                            .filter(d => d.trim() !== clickedDate)
                            .join('\n')
                        setSignalDates(updatedDates)
                    } else {
                        const newDates = signalDates.trim() 
                            ? signalDates + '\n' + clickedDate 
                            : clickedDate
                        setSignalDates(newDates)
                    }
                } else {
                    if (parsedSignalDates2.has(clickedDate)) {
                        const updatedDates = signalDates2
                            .split('\n')
                            .filter(d => d.trim() !== clickedDate)
                            .join('\n')
                        setSignalDates2(updatedDates)
                    } else {
                        const newDates = signalDates2.trim() 
                            ? signalDates2 + '\n' + clickedDate 
                            : clickedDate
                        setSignalDates2(newDates)
                    }
                }
            }
        }
    }, [activeSignalSet, parsedData, parsedSignalDates, parsedSignalDates2, signalDates, signalDates2])

    const chartData = useMemo(() => ({
        labels: parsedData.map(d => d.date),
        datasets: [{
            label: 'Fiyat',
            data: parsedData.map(d => d.price),
            borderColor: '#5F5E5A',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointBorderWidth: 0,
            pointBorderColor: 'transparent',
            pointBackgroundColor: 'transparent',
            tension: 0.4,
            fill: false,
            order: 2,
        }, {
            label: 'İşaretler 1',
            data: parsedData.map(d => parsedSignalDates.has(d.date) ? d.price : null),
            borderColor: 'transparent',
            borderWidth: 0,
            pointRadius: parsedData.map(d => parsedSignalDates.has(d.date) ? 6 : 0),
            pointBackgroundColor: '#D85A30',
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverRadius: 8,
            showLine: false,
            fill: false,
            order: 1,
        }, {
            label: 'İşaretler 2',
            data: parsedData.map(d => parsedSignalDates2.has(d.date) ? d.price : null),
            borderColor: 'transparent',
            borderWidth: 0,
            pointRadius: parsedData.map(d => parsedSignalDates2.has(d.date) ? 6 : 0),
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverRadius: 8,
            showLine: false,
            fill: false,
            order: 1,
        }, {
            label: 'Hover Göstergesi',
            data: parsedData.map((d, idx) => hoveredIndex === idx ? d.price : null),
            borderColor: 'transparent',
            borderWidth: 0,
            pointRadius: parsedData.map((_, idx) => hoveredIndex === idx ? 5 : 0),
            pointBackgroundColor: activeSignalSet === 1 ? 'rgba(216, 90, 48, 0.5)' : 'rgba(59, 130, 246, 0.5)',
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverRadius: 5,
            showLine: false,
            fill: false,
            order: 0,
        }],
    }), [parsedData, parsedSignalDates, parsedSignalDates2, hoveredIndex, activeSignalSet])

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index' as const
        },
        onClick: (_: never, elements: ChartElement[]) => handleChartClick(elements),
        onHover: (_: never, elements: ChartElement[]) => handleChartHover(elements),
        plugins: {
            legend: { display: false },
            filler: { propagate: false },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#D85A30',
                borderWidth: 1,
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(107, 114, 128, 0.1)',
                    drawBorder: false,
                },
                ticks: {
                    color: 'rgba(107, 114, 128, 0.7)',
                }
            },
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: 'rgba(107, 114, 128, 0.7)',
                }
            }
        }
    }), [handleChartClick, handleChartHover])

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 p-4 flex flex-col bg-white dark:bg-gray-900">
                <button
                    onClick={() => setIsFullscreen(false)}
                    className="self-end p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                    title="Küçült"
                >
                    <Minimize2 className="w-6 h-6 text-gray-800 dark:text-gray-100" />
                </button>
                <div className="flex-1 w-full" style={{ minHeight: 0, position: 'relative' }}>
                    {parsedData.length > 0 ? (
                        <Line data={chartData} options={options} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            {t("common.noData", "No data available")}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">{t("charts.title", "Charts")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                CSV verisi girin (Tarih, Fiyat):
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fiyat Verileri
                        </label>
                        <textarea
                            className="w-full h-40 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-gray-100"
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            placeholder="2023-10-01, 25000"
                        />
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Grafikten tıkla ekle:
                        </p>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="signalSet"
                                    value="1"
                                    checked={activeSignalSet === 1}
                                    onChange={() => setActiveSignalSet(1)}
                                    className="w-4 h-4"
                                />
                                <span className="w-3 h-3 bg-orange-600 rounded-full" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">İşaretler 1 (Kırmızı)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="signalSet"
                                    value="2"
                                    checked={activeSignalSet === 2}
                                    onChange={() => setActiveSignalSet(2)}
                                    className="w-4 h-4"
                                />
                                <span className="w-3 h-3 bg-blue-500 rounded-full" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">İşaretler 2 (Mavi)</span>
                            </label>
                        </div>
                    </div>
                
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 items-center gap-2">
                            <span className="w-3 h-3 bg-orange-600 rounded-full" />
                            İşaret Edilecek Tarihler
                        </label>
                        <textarea
                            className="w-full h-20 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-gray-100"
                            value={signalDates}
                            onChange={(e) => setSignalDates(e.target.value)}
                            placeholder="2023-10-03"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Her tarihi yeni satırda yazınız
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 items-center gap-2">
                            <span className="w-3 h-3 bg-blue-500 rounded-full" />
                            Ekstra İşaret Tarihleri
                        </label>
                        <textarea
                            className="w-full h-20 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-gray-100"
                            value={signalDates2}
                            onChange={(e) => setSignalDates2(e.target.value)}
                            placeholder="2023-10-02"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Her tarihi yeni satırda yazınız
                        </p>
                    </div>
                </div>
            
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 relative">
                    <button
                        onClick={() => setIsFullscreen(true)}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition z-10"
                        title="Tam Ekran"
                    >
                        <Maximize2 className="w-5 h-5" />
                    </button>
                    <div style={{ position: 'relative', height: '400px' }}>
                        {parsedData.length > 0 ? (
                            <Line data={chartData} options={options} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                {t("common.noData", "No data available")}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChartsPage
