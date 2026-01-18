import { http } from './api/httpClient';

export interface MACDPoint {
    date: string;
    macd: number;
    signal: number;
    histogram: number;
}

export async function getMACD(coinSymbol: string): Promise<MACDPoint[]> {
    return http.get<MACDPoint[]>(`/macd/coin/${coinSymbol.toLowerCase()}`);
}
