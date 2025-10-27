import React, { useState } from "react"
import { type Coin } from "@/services/coinService"
import CoinRow from "./CoinRow"
import { ChevronUp, ChevronDown, ChevronsUpDown, X } from "lucide-react"
import {useTranslation} from "react-i18next";

interface CoinTableProps {
    coins: Coin[]
}

type SortField = "change24h" | "change7d" | null
type SortOrder = "asc" | "desc"

const CoinTable: React.FC<CoinTableProps> = ({ coins }) => {
    const [sortField, setSortField] = useState<SortField>(null)
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
    const { t } = useTranslation();

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortOrder("desc")
        }
    }

    const clearSort = () => {
        setSortField(null)
        setSortOrder("desc")
    }

    const sortedCoins = [...coins].sort((a, b) => {
        if (!sortField) return 0

        const aValue = a[sortField]
        const bValue = b[sortField]

        if (sortOrder === "asc") {
            return aValue - bValue
        } else {
            return bValue - aValue
        }
    })

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <ChevronsUpDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        }
        return sortOrder === "asc" ? (
            <ChevronUp className="w-4 h-4 text-blue-500" />
        ) : (
            <ChevronDown className="w-4 h-4 text-blue-500" />
        )
    }

    return (
        <div>
            {sortField && (
                <div className="flex items-center justify-end mb-3">
                    <button
                        onClick={clearSort}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                    >
                        <X className="w-4 h-4" />
                        {t("coins.clearFilter")}
                    </button>
                </div>
            )}
            
            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-left text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs">
                    <tr>
                        <th className="p-3"> {t("coins.coin")}</th>
                        <th className="p-3"> {t("coins.price")}</th>
                        <th 
                            className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition select-none"
                            onClick={() => handleSort("change24h")}
                        >
                            <div className="flex items-center gap-1">
                                {t("coins.change24h")}
                                <SortIcon field="change24h" />
                            </div>
                        </th>
                        <th 
                            className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition select-none"
                            onClick={() => handleSort("change7d")}
                        >
                            <div className="flex items-center gap-1">
                                {t("coins.change7d")}
                                <SortIcon field="change7d" />
                            </div>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedCoins.map((coin, index) => (
                        <CoinRow key={`${coin.id}-${index}`} coin={coin} />
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default CoinTable
