import { http } from './api/httpClient';

export interface BollingerBandsPoint {
    Date: string;
    MA20: number;
    UpperBand: number;
    LowerBand: number;
}

export async function getBollingerBands(coinId: string): Promise<BollingerBandsPoint[]> {
    return http.get<BollingerBandsPoint[]>(`/coins/${coinId}/bollinger-bands`);
}

export interface BollingerBandSignal {
    id: string;
    name: string;
    symbol: string;
    price: number;
    point: BollingerBandsPoint;
}

export async function getBollingerBandSignals(): Promise<BollingerBandSignal[]> {
    return http.get<BollingerBandSignal[]>('/coins/bollinger-bands');
}