
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cryptoapi.daddydemir.dev/api/v1';

export interface MovingAveragePoint {
    date: string;
    ma7: number;
    ma25: number;
    ma99: number;
}

export async function getMovingAverages(coinId: string): Promise<MovingAveragePoint[]> {
    const response = await fetch(`${API_BASE_URL}/coins/${coinId}/moving-averages?days=-1`);

    if (!response.ok) {
        throw new Error('Failed to fetch moving averages');
    }

    return response.json();
}

export interface MovingAverageSignal {
    id: string;
    name: string;
    symbol: string;
    price: number;
    points: MovingAveragePoint[];
}

export async function getMovingAverageSignals(): Promise<MovingAverageSignal[]> {
    const response = await fetch(`${API_BASE_URL}/coins/moving-averages`);

    if (!response.ok) {
        throw new Error('Failed to fetch Moving Averages signals');
    }

    return response.json();
}