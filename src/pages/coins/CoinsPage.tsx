import React, { useMemo } from "react"
import { getTopCoins } from "@/services/coinService"
import CoinTable from "@/components/coins/CoinTable"
import { useTranslation } from "react-i18next"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import { useCryptoWebSocket } from "@/hooks/useCryptoWebSocket"

const CoinsPage: React.FC = () => {
    const { t } = useTranslation()
    const { data: coins, loading, refreshing, refresh, lastUpdateText } = useCachedData({
        cacheKey: 'top-coins',
        fetchFn: getTopCoins
    })

    const wsPrices = useCryptoWebSocket()

    const updatedCoins = useMemo(() => {
        if (!coins) return []
        if (Object.keys(wsPrices).length === 0) return coins

        return coins.map(coin => {
            if (wsPrices[coin.symbol]) {
                return {
                    ...coin,
                    livePrice: wsPrices[coin.symbol]
                }
            }
            return coin
        })
    }, [coins, wsPrices])

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t("common.loading", "Loading...")}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-shell">
            <div className="page-hero mb-6">
                <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Market overview</p>
                    <h1 className="text-3xl font-bold tracking-tight text-white">{t("coins.top100")}</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        {t("coins.totalCoins", "Total {{count}} coins", { count: coins?.length || 0 })}
                    </p>
                </div>
                <RefreshButton
                    onRefresh={refresh}
                    refreshing={refreshing}
                    lastUpdateText={lastUpdateText}
                />
                </div>
            </div>
            <CoinTable coins={updatedCoins} />
        </div>
    )
}

export default CoinsPage
