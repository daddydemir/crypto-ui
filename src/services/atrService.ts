const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cryptoapi.daddydemir.dev/api/v1';

export interface ATRPoint {
    Time: string;
    Point: number;
}

export async function getATR(coinSymbol: string): Promise<ATRPoint[]> {
    const response = await fetch(`${API_BASE_URL}/atr/coin/${coinSymbol.toLowerCase()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch ATR data');
    }

    return response.json();
}