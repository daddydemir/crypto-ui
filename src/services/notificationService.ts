import { http } from './api/httpClient';

export interface CryptoNotification {
    Type: string;
    Coin: string;
    CreateTime: number;
    Image: string;
}

export async function getNotifications(): Promise<CryptoNotification[]> {
    try {
        return await http.get<CryptoNotification[]>('/notifications');
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}
