import React from "react"
import { type Coin } from "@/services/coinService"

interface CoinRowProps {
    coin: Coin
}

const CoinRow: React.FC<CoinRowProps> = ({ coin }) => {
    const getChangeColor = (value: number) => {
        return value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
    }

    const formatPrice = (price: number) => {
        if (price < 0.00001) {
            return `$${price.toFixed(10).replace(/\.?0+$/, '')}`
        } else if (price < 0.001) {
            return `$${price.toFixed(8).replace(/\.?0+$/, '')}`
        } else if (price < 0.1) {
            return `$${price.toFixed(6).replace(/\.?0+$/, '')}`
        } else if (price < 1) {
            return `$${price.toFixed(5)}`
        } else if (price < 100) {
            return `$${price.toFixed(3)}`
        }
        else {
            return `$${price.toFixed(2).replace(/\.0$/, '')}`
        }
    }

    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{coin.name}</td>
            <td className="p-3 text-gray-900 dark:text-gray-100">{formatPrice(coin.price)}</td>
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
