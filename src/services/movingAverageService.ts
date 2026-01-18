import { http } from './api/httpClient';

export interface MovingAveragePoint {
    date: string;
    ma7: number;
    ma25: number;
    ma99: number;
}

export async function getMovingAverages(coinId: string): Promise<MovingAveragePoint[]> {
    return http.get<MovingAveragePoint[]>(`/coins/${coinId}/moving-averages?days=-1`);
}

export interface MovingAverageSignal {
    id: string;
    name: string;
    symbol: string;
    price: number;
    points: MovingAveragePoint[];
}

export async function getMovingAverageSignals(): Promise<MovingAverageSignal[]> {
    return http.get<MovingAverageSignal[]>('/coins/moving-averages');
}