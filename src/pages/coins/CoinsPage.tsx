import React from "react"
import { getTopCoins } from "@/services/coinService"
import CoinTable from "@/components/coins/CoinTable"
import { useTranslation } from "react-i18next"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"

const CoinsPage: React.FC = () => {
    const { t } = useTranslation()
    const { data: coins, loading, refreshing, refresh, lastUpdateText } = useCachedData({
        cacheKey: 'top-coins',
        fetchFn: getTopCoins
    })

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
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1">{t("coins.top100")}</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("coins.totalCoins", "Total {{count}} coins", { count: coins?.length || 0 })}
                    </p>
                </div>
                <RefreshButton
                    onRefresh={refresh}
                    refreshing={refreshing}
                    lastUpdateText={lastUpdateText}
                />
            </div>
            <CoinTable coins={coins || []} />
        </div>
    )
}

export default CoinsPage
