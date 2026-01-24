import React, { useState } from "react"
import { getRSITopCoins } from "@/services/rsiService"
import RSITable from "@/components/analyses/RSITable"
import { useTranslation } from "react-i18next"
import { TrendingUp, TrendingDown, Activity, Info } from "lucide-react"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import Modal from "@/components/common/Modal"

const RSIPage: React.FC = () => {
    const { t } = useTranslation()
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const { data: coins, loading, refreshing, refresh, lastUpdateText } = useCachedData({
        cacheKey: 'rsi-coins',
        fetchFn: getRSITopCoins
    })

    const validCoins = coins?.filter(c => c.rsi !== 0) || []
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
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold">{t("rsi.title")}</h1>
                            <button
                                onClick={() => setIsDetailOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            >
                                <Info className="w-4 h-4" />
                                {t("indicators.detail")}
                            </button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">{t("rsi.description")}</p>
                    </div>
                    <RefreshButton
                        onRefresh={refresh}
                        refreshing={refreshing}
                        lastUpdateText={lastUpdateText}
                    />
                </div>
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

            <RSITable coins={coins || []} />

            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={t("indicators.rsi.title")}
            >
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        {t("indicators.rsi.description")}
                    </p>

                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                            {t("indicators.rsi.interpretation.title")}
                        </h4>
                        <div className="grid gap-4">
                            {(t("indicators.rsi.interpretation.levels", { returnObjects: true }) as any[]).map((level, i) => (
                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="font-medium text-blue-600 dark:text-blue-400 block mb-1">
                                        {level.value}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {level.meaning}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                {t("indicators.rsi.interpretation.buy_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.rsi.interpretation.buy_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                {t("indicators.rsi.interpretation.sell_signals.title")}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {(t("indicators.rsi.interpretation.sell_signals.items", { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {t("indicators.rsi.warnings.title")}
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                            {(t("indicators.rsi.warnings.items", { returnObjects: true }) as string[]).map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                {t("indicators.rsi.tip.title")}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {t("indicators.rsi.tip.content")}
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default RSIPage