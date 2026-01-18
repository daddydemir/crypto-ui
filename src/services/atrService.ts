import { http } from './api/httpClient';

export interface ATRPoint {
    Time: string;
    Point: number;
}

export async function getATR(coinSymbol: string): Promise<ATRPoint[]> {
    return http.get<ATRPoint[]>(`/atr/coin/${coinSymbol.toLowerCase()}`);
}