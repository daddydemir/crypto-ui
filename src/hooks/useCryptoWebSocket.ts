import { useState, useEffect, useCallback, useRef } from 'react';

interface WSMessage {
    s: string; // symbol
    p: string; // price (sometimes returned as string from exchanges, we should handle both)
    t: number; // time
}

export interface PriceUpdate {
    symbol: string;
    price: number;
    time: number;
}

export function useCryptoWebSocket(url: string = 'wss://cryptoapi.daddydemir.dev/ws') {
    const [prices, setPrices] = useState<Record<string, number>>({});
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<any>(null);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        console.log('Connecting to WebSocket:', url);
        const socket = new WebSocket(url);

        socket.onopen = () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }
        };

        socket.onmessage = (event) => {
            const rawData = event.data;
            try {
                if (typeof rawData !== 'string') return;

                // Sometimes multiple JSON objects are sent in one message block like {...}{...}
                // We'll split them and process each
                const jsonStrings = rawData.trim().match(/{.*?}/g);

                if (!jsonStrings) return;

                jsonStrings.forEach(jsonStr => {
                    try {
                        const data: WSMessage = JSON.parse(jsonStr);
                        if (data && data.s && data.p) {
                            setPrices(prev => ({
                                ...prev,
                                [data.s]: parseFloat(data.p.toString())
                            }));
                        }
                    } catch (e) {
                        // Silent fail for single chunk parsing
                    }
                });
            } catch (error) {
                // Silent fail for general message handling
            }
        };

        socket.onclose = () => {
            if (!reconnectTimeout.current) {
                reconnectTimeout.current = setTimeout(connect, 5000);
            }
        };

        socket.onerror = () => {
            socket.close();
        };

        ws.current = socket;
    }, [url]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) {
                ws.current.onclose = null; // Prevent reconnection on unmount
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [connect]);

    return prices;
}
