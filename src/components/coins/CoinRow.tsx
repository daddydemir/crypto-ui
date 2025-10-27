import React from "react"
import { type Coin } from "@/services/coinService"

interface CoinRowProps {
    coin: Coin
}

const CoinRow: React.FC<CoinRowProps> = ({ coin }) => {
    const getChangeColor = (value: number) => {
        return value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
    }

    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{coin.name}</td>
            <td className="p-3 text-gray-900 dark:text-gray-100">${coin.price.toLocaleString()}</td>
            <td className={`p-3 ${getChangeColor(coin.change24h)}`}>
                {coin.change24h > 0 ? "+" : ""}
                {coin.change24h}%
            </td>
            <td className={`p-3 ${getChangeColor(coin.change7d)}`}>
                {coin.change7d > 0 ? "+" : ""}
                {coin.change7d}%
            </td>
        </tr>
    )
}

export default CoinRow
