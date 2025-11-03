const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cryptoapi.daddydemir.dev/api/v1';

export interface BollingerBandsPoint {
    Date: string;
    MA20: number;
    UpperBand: number;
    LowerBand: number;
}

export async function getBollingerBands(coinId: string): Promise<BollingerBandsPoint[]> {
    const response = await fetch(`${API_BASE_URL}/coins/${coinId}/bollinger-bands?days=-1`);

    if (!response.ok) {
        throw new Error('Failed to fetch Bollinger Bands');
    }

    return response.json();
}