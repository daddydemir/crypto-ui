import { http } from './api/httpClient'

export interface Coin {
    id: string
    name: string
    symbol: string
    price: number
    change24h: number
    change7d: number
    change30d: number
    arithmeticChange7d: number
    arithmeticChange30d: number
    livePrice?: number
}

export async function getTopCoins(): Promise<Coin[]> {
    try {
        return await http.get<Coin[]>('/topCoins')
    } catch (error) {
        console.error('Error fetching top coins:', error)
        return []
    }
}

export async function getCoinHistory(symbol: string, year?: string, month?: string) {
    try {
        const queryParams = new URLSearchParams()
        if (year) queryParams.append('year', year)
        if (month) queryParams.append('month', month)

        const queryStr = queryParams.toString()
        const url = `/binance/coin/${symbol.toLowerCase()}${queryStr ? `?${queryStr}` : ''}`
        return await http.get<any[]>(url)
    } catch (error) {
        console.error(`Error fetching history for ${symbol}:`, error)
        return []
    }
}
