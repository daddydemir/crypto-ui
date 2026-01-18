import { http } from './api/httpClient';

export interface DonchianChannelsPoint {
    Upper: number;
    Lower: number;
    Middle: number;
    Date: string;
    Price: number;
}

export async function getDonchianChannels(coinSymbol: string): Promise<DonchianChannelsPoint[]> {
    return http.get<DonchianChannelsPoint[]>(`/donchian/coin/${coinSymbol.toLowerCase()}`);
}

export interface DonchianChannelSignal {
    id: string;
    name: string;
    symbol: string;
    price: number;
    point: DonchianChannelsPoint;
}

export async function getDonchianChannelSignals(): Promise<DonchianChannelSignal[]> {
    return http.get<DonchianChannelSignal[]>('/donchian/signals');
}
