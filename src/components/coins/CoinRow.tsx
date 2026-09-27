import React from "react"
import { type Coin } from "@/services/coinService"

interface CoinRowProps {
    coin: Coin
}

const CoinRow: React.FC<CoinRowProps> = ({ coin }) => {
    const getLivePriceColor = () => {
        if (!coin.livePrice || coin.livePrice === coin.price) return "text-gray-500 dark:text-gray-400"
        return coin.livePrice > coin.price
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
    }

    const formatPrice = (price?: number) => {
        if (price === undefined) return ""
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

    const ChangeBadge = ({ value }: { value: number }) => <span className={`inline-flex min-w-20 justify-center rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold ${value >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"}`}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>

    return (
        <tr className="border-b border-slate-100 transition hover:bg-indigo-50/35 dark:border-slate-800 dark:hover:bg-indigo-950/10">
            <td className="p-3.5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">{coin.symbol.slice(0, 2)}</span><div><p className="font-bold text-slate-900 dark:text-white">{coin.symbol}</p><p className="text-xs text-slate-500">{coin.name}</p></div></div></td>
            <td className="p-3.5 font-mono font-semibold text-gray-900 dark:text-gray-100">
                <span className="mr-2">{formatPrice(coin.price)}</span>
                {coin.livePrice && (
                    <span className={`text-xs font-medium ${getLivePriceColor()}`}>
                        ({formatPrice(coin.livePrice)})
                    </span>
                )}
            </td>
            <td className="p-3"><ChangeBadge value={coin.change24h}/></td>
            <td className="p-3"><ChangeBadge value={coin.change7d}/></td>
            <td className="p-3"><ChangeBadge value={coin.change30d}/></td>
            <td className="p-3"><ChangeBadge value={coin.arithmeticChange7d}/></td>
            <td className="p-3"><ChangeBadge value={coin.arithmeticChange30d}/></td>
        </tr>
    )
}

export default CoinRow
