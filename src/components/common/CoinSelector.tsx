import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getTopCoins, type Coin } from '@/services/coinService'
import { useCachedData } from '@/hooks/useCachedData'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

    const handleSelectChange = (coinID: string) => {
        const coinPrefix = coins?.find(c => c.id === coinID)
        if (coinPrefix) {
            onChange(coinPrefix)
        }
    }

    return (
        <div className={`surface-card mb-6 p-5 ${className || ''}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('common.selectCrypto', 'Select Cryptocurrency')}
            </label>
            {coinsLoading ? (
                <div className="w-full md:w-96 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
                    {t('common.loadingCoins', 'Loading coins...')}
                </div>
            ) : (
                <Select
                    value={value}
                    onValueChange={handleSelectChange}
                >
					<SelectTrigger className="h-10 w-full bg-white md:w-96 dark:bg-gray-800">
						<SelectValue placeholder={t('common.selectCrypto', 'Select Cryptocurrency')} />
					</SelectTrigger>
					<SelectContent searchPlaceholder={t('topbar.search', 'Search...')}>
						{coins?.map((coin) => (
							<SelectItem key={coin.id} value={coin.id}>
								{coin.symbol.toUpperCase()} - {coin.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
            )}
        </div>
    )
}

export default CoinSelector
