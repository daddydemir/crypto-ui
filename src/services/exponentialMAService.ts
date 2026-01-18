import { http } from './api/httpClient';

export interface MovingAveragePoint {
    date: string;
    ma7: number;
    ma25: number;
    ma99: number;
}

export async function getMovingAverages(coinId: string): Promise<MovingAveragePoint[]> {
    return http.get<MovingAveragePoint[]>(`/coins/${coinId}/exponential-moving-averages?days=-1`);
}