import React, { useState } from "react"
import { type RSICoin, getRSIStatus, getRSIColor, getRSIBgColor } from "@/services/rsiService"
import { ChevronUp, ChevronDown, ChevronsUpDown, X } from "lucide-react"
import { useTranslation } from "react-i18next"

interface RSITableProps {
    coins: RSICoin[]
}

type SortOrder = "asc" | "desc" | null

const RSITable: React.FC<RSITableProps> = ({ coins }) => {
    const [sortOrder, setSortOrder] = useState<SortOrder>(null)
    const [filterStatus, setFilterStatus] = useState<'all' | 'overbought' | 'oversold' | 'neutral'>('all')
    const { t } = useTranslation()

    const handleSort = () => {
        if (sortOrder === null) {
            setSortOrder("desc")
        } else if (sortOrder === "desc") {
            setSortOrder("asc")
        } else {
            setSortOrder(null)
        }
    }

    const clearFilters = () => {
        setSortOrder(null)
        setFilterStatus('all')
    }

    const filteredCoins = coins.filter(coin => {
        if (coin.rsi === 0) return false
        if (filterStatus === 'all') return true
        return getRSIStatus(coin.rsi) === filterStatus
    })

    const sortedCoins = [...filteredCoins].sort((a, b) => {
        if (sortOrder === null) return 0
        if (sortOrder === "asc") {
            return a.rsi - b.rsi
        } else {
            return b.rsi - a.rsi
        }
    })

    const SortIcon = () => {
        if (sortOrder === null) {
            return <ChevronsUpDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        }
        return sortOrder === "asc" ? (
            <ChevronUp className="w-4 h-4 text-blue-500" />
        ) : (
            <ChevronDown className="w-4 h-4 text-blue-500" />
        )
    }

    const formatCoinName = (coinId: string) => {
        return coinId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const getRSIStatusLabel = (rsi: number) => {
        const status = getRSIStatus(rsi)
        if (status === 'overbought') return t("rsi.overbought")
        if (status === 'oversold') return t("rsi.oversold")
        return t("rsi.neutral")
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg transition ${
                            filterStatus === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {t("rsi.all")}
                    </button>
                    <button
                        onClick={() => setFilterStatus('overbought')}
                        className={`px-4 py-2 rounded-lg transition ${
                            filterStatus === 'overbought'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {t("rsi.overbought")} (≥70)
                    </button>
                    <button
                        onClick={() => setFilterStatus('oversold')}
                        className={`px-4 py-2 rounded-lg transition ${
                            filterStatus === 'oversold'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {t("rsi.oversold")} (≤30)
                    </button>
                    <button
                        onClick={() => setFilterStatus('neutral')}
                        className={`px-4 py-2 rounded-lg transition ${
                            filterStatus === 'neutral'
                                ? 'bg-gray-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {t("rsi.neutral")}
                    </button>
                </div>

                {(sortOrder !== null || filterStatus !== 'all') && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                    >
                        <X className="w-4 h-4" />
                        {t("rsi.clearFilters")}
                    </button>
                )}
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-left text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs">
                    <tr>
                        <th className="p-3">{t("rsi.coin")}</th>
                        <th
                            className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition select-none"
                            onClick={handleSort}
                        >
                            <div className="flex items-center gap-1">
                                {t("rsi.rsiValue")}
                                <SortIcon />
                            </div>
                        </th>
                        <th className="p-3">{t("rsi.status")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedCoins.map((coin, index) => (
                        <tr key={`${coin.coin_id}-${index}`} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                                {formatCoinName(coin.coin_id)}
                            </td>
                            <td className="p-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[200px]">
                                        <div
                                            className={`h-2 rounded-full transition-all ${
                                                coin.rsi >= 70 ? 'bg-red-500' :
                                                    coin.rsi <= 30 ? 'bg-green-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${coin.rsi}%` }}
                                        />
                                    </div>
                                    <span className={`font-semibold ${getRSIColor(coin.rsi)}`}>
                                            {coin.rsi.toFixed(2)}
                                        </span>
                                </div>
                            </td>
                            <td className="p-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRSIBgColor(coin.rsi)} ${getRSIColor(coin.rsi)}`}>
                                        {getRSIStatusLabel(coin.rsi)}
                                    </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {t("rsi.showingCoins")}: {sortedCoins.length} / {coins.filter(c => c.rsi !== 0).length}
            </div>
        </div>
    )
}

export default RSITable