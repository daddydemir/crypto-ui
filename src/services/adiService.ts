import { http } from './api/httpClient';

export interface ADIPoint {
    date: string;
    adi: number;
    pdi: number;
    mdi: number;
    dx: number;
}

export async function getADI(coinSymbol: string): Promise<ADIPoint[]> {
    return http.get<ADIPoint[]>(`/adi/coin/${coinSymbol.toLowerCase()}`);
}
