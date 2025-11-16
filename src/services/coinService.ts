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
}

export async function getTopCoins(): Promise<Coin[]> {
    try {
        const response = await fetch('https://cryptoapi.daddydemir.dev/api/v1/topCoins')
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        console.error('Error fetching top coins:', error)
        return []
    }
}
