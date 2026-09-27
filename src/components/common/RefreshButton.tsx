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
                className="primary-action"
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
