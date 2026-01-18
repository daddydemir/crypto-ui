import { http } from './api/httpClient'

export interface RSICoin {
    coin_id: string
    name: string
    rsi: number
}

export interface RSIHistoryPoint {
    rsi: number
    date: string
}


export async function getRSITopCoins(): Promise<RSICoin[]> {
    try {
        return await http.get<RSICoin[]>('/topCoinsRSI')
    } catch (error) {
        console.error('Error fetching RSI coins:', error)
        return []
    }
}

export async function getRSIHistory(coinId: string): Promise<RSIHistoryPoint[]> {
    try {
        return await http.get<RSIHistoryPoint[]>(`/coins/${coinId}/rsi/history?days=0`)
    } catch (error) {
        console.error('Error fetching RSI history:', error)
        return []
    }
}

export function getRSIStatus(rsi: number): 'overbought' | 'oversold' | 'neutral' {
    if (rsi >= 70) return 'overbought'
    if (rsi <= 30) return 'oversold'
    return 'neutral'
}

export function getRSIColor(rsi: number): string {
    if (rsi >= 70) return 'text-red-600 dark:text-red-400'
    if (rsi <= 30) return 'text-green-600 dark:text-green-400'
    return 'text-gray-600 dark:text-gray-400'
}

export function getRSIBgColor(rsi: number): string {
    if (rsi >= 70) return 'bg-red-100 dark:bg-red-900/30'
    if (rsi <= 30) return 'bg-green-100 dark:bg-green-900/30'
    return 'bg-gray-100 dark:bg-gray-800'
}
