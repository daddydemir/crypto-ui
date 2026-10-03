import { http } from './api/httpClient'
export type SearchType='COIN'|'STRATEGY'|'STRATEGY_RUN'|'ALERT'|'TRADE'|'PAGE'
export type SearchItem={id:string;type:SearchType;title:string;subtitle:string;meta:string;route?:string}
export type SearchResults={coins:SearchItem[];strategies:SearchItem[];strategyRuns:SearchItem[];alerts:SearchItem[];trades:SearchItem[]}
export const globalSearch=(query:string,limit=5)=>http.get<SearchResults>(`/search?q=${encodeURIComponent(query)}&limit=${limit}`)
