import React from 'react'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface RefreshButtonProps {
    onRefresh: () => void
    refreshing: boolean
    disabled?: boolean
    lastUpdateText: string
    showLastUpdate?: boolean
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
                                                         onRefresh,
                                                         refreshing,
                                                         disabled = false,
                                                         lastUpdateText,
                                                         showLastUpdate = true
                                                     }) => {
    const { t } = useTranslation()

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={onRefresh}
                disabled={refreshing || disabled}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t("common.refreshing", "Refreshing...") : t("common.refresh", "Refresh")}
            </button>
            {showLastUpdate && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t("common.lastUpdate", "Last update")}: {lastUpdateText}
                </span>
            )}
        </div>
    )
}

export default RefreshButton