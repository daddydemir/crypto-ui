const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cryptoapi.daddydemir.dev/api/v1';

export interface DonchianChannelsPoint {
    Upper: number;
    Lower: number;
    Middle: number;
    Date: string;
    Price: number;
}

export async function getDonchianChannels(coinSymbol: string): Promise<DonchianChannelsPoint[]> {
    const response = await fetch(`${API_BASE_URL}/donchian/coin/${coinSymbol.toLowerCase()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch Donchian Channels');
    }

    return response.json();
}

export interface DonchianChannelSignal {
    id: string;
    name: string;
    symbol: string;
    price: number;
    point: DonchianChannelsPoint;
}

export async function getDonchianChannelSignals(): Promise<DonchianChannelSignal[]> {
    const response = await fetch(`${API_BASE_URL}/donchian/signals`);

    if (!response.ok) {
        throw new Error('Failed to fetch Donchian Channel signals');
    }

    return response.json();
}
