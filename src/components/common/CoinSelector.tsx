import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getTopCoins, type Coin } from '@/services/coinService'
import { useCachedData } from '@/hooks/useCachedData'

interface CoinSelectorProps {
    value?: string
    onChange: (coin: Coin) => void
    className?: string
}

const CoinSelector: React.FC<CoinSelectorProps> = ({ value, onChange, className }) => {
    const { t } = useTranslation()

    const { data: coins, loading: coinsLoading } = useCachedData({
        cacheKey: 'top-coins',
        fetchFn: getTopCoins
    })

    // Auto-select first coin if none selected
    useEffect(() => {
        if (coins && coins.length > 0 && !value) {
            onChange(coins[0])
        }
    }, [coins, value, onChange])

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const coinPrefix = coins?.find(c => c.id === e.target.value)
        if (coinPrefix) {
            onChange(coinPrefix)
        }
    }

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 mb-6 ${className || ''}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('common.selectCrypto', 'Select Cryptocurrency')}
            </label>
            {coinsLoading ? (
                <div className="w-full md:w-96 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
                    {t('common.loadingCoins', 'Loading coins...')}
                </div>
            ) : (
                <select
                    value={value}
                    onChange={handleSelectChange}
                    className="w-full md:w-96 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                    {coins?.map((coin) => (
                        <option key={coin.id} value={coin.id}>
                            {coin.symbol.toUpperCase()} - {coin.name}
                        </option>
                    ))}
                </select>
            )}
        </div>
    )
}

export default CoinSelector
