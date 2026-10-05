import React, { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import RefreshButton from '@/components/common/RefreshButton'
import CoinSelector from '@/components/common/CoinSelector'
import { type Coin } from '@/services/coinService'

interface AnalysisPageLayoutProps {
    title: string
    headerContent?: ReactNode
    description: string
    selectedCoin?: Coin
    onCoinChange: (coin: Coin | undefined) => void
    onRefresh?: () => void
    refreshing?: boolean
    lastUpdateText?: string
    loading?: boolean
    error?: Error | null
    children: ReactNode
    showCoinSelector?: boolean
}

const AnalysisPageLayout: React.FC<AnalysisPageLayoutProps> = ({
    title,
    headerContent,
    description,
    selectedCoin,
    onCoinChange,
    onRefresh,
    refreshing = false,
    lastUpdateText,
    loading = false,
    error,
    children,
    showCoinSelector = true
}) => {
    const { t } = useTranslation()

    return (
        <div className="page-shell">
            <div>
                {/* Header */}
                <div className="page-hero mb-6">
                    <div className="relative z-10 flex min-w-0 flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    {title}
                                </h1>
                                {headerContent}
                            </div>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                                {description}
                            </p>
                        </div>

                        {selectedCoin && onRefresh && lastUpdateText && (
                            <RefreshButton
                                onRefresh={onRefresh}
                                refreshing={refreshing}
                                disabled={loading}
                                lastUpdateText={lastUpdateText}
                            />
                        )}
                    </div>
                </div>

                {/* Coin Selector */}
                {showCoinSelector && (
                    <CoinSelector
                        value={selectedCoin?.id}
                        onChange={onCoinChange}
                    />
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                        <p className="text-red-600 dark:text-red-400">
                            {error.message || t('common.errorLoading', 'Failed to load data')}
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {loading && !selectedCoin ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    )
}

export default AnalysisPageLayout
