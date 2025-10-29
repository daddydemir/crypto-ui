import React, { useEffect, useState } from "react"
import { type RSICoin, getRSITopCoins } from "@/services/rsiService"
import RSITable from "@/components/analyses/RSITable"
import { useTranslation } from "react-i18next"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

const RSIPage: React.FC = () => {
    const [coins, setCoins] = useState<RSICoin[]>([])
    const [loading, setLoading] = useState(true)
    const { t } = useTranslation()

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const data = await getRSITopCoins()
            setCoins(data)
            setLoading(false)
        }
        
        fetchData()
    }, [])

    const validCoins = coins.filter(c => c.rsi !== 0)
    const overboughtCount = validCoins.filter(c => c.rsi >= 70).length
    const oversoldCount = validCoins.filter(c => c.rsi <= 30).length
    const neutralCount = validCoins.filter(c => c.rsi > 30 && c.rsi < 70).length

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t("rsi.loading")}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">{t("rsi.title")}</h1>
                <p className="text-gray-600 dark:text-gray-400">{t("rsi.description")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{t("rsi.overbought")}</p>
                            <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{overboughtCount}</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-red-500 dark:text-red-400" />
                    </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">{t("rsi.oversold")}</p>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{oversoldCount}</p>
                        </div>
                        <TrendingDown className="w-10 h-10 text-green-500 dark:text-green-400" />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t("rsi.neutral")}</p>
                            <p className="text-3xl font-bold text-gray-700 dark:text-gray-300 mt-1">{neutralCount}</p>
                        </div>
                        <Activity className="w-10 h-10 text-gray-500 dark:text-gray-400" />
                    </div>
                </div>
            </div>

            <RSITable coins={coins} />
        </div>
    )
}

export default RSIPage