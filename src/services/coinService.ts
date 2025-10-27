export interface Coin {
    id: string
    name: string
    symbol: string
    price: number
    change24h: number
    change7d: number
}

export async function getTopCoins(): Promise<Coin[]> {
    return [
        { id: "btc", name: "Bitcoin", symbol: "BTC", price: 67000, change24h: 1.2, change7d: -0.8 },
        { id: "eth", name: "Ethereum", symbol: "ETH", price: 3200, change24h: 2.5, change7d: 5.1 },
        { id: "bnb", name: "Binance Coin", symbol: "BNB", price: 590, change24h: -0.4, change7d: -1.2 },
        { id: "sol", name: "Solana", symbol: "SOL", price: 145, change24h: 3.1, change7d: 7.3 },
    ]
}
