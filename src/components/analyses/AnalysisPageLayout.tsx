import React, { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import RefreshButton from '@/components/common/RefreshButton'
import CoinSelector from '@/components/common/CoinSelector'
import { type Coin } from '@/services/coinService'

interface AnalysisPageLayoutProps {
    title: string
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {title}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
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
