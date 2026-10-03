import { http } from './api/httpClient'

export type BreadthTimeframe = '1d'
export type BreadthPeriod = '30d' | '90d' | '1y'
export type BreadthMetric = 'above_ma7'|'above_ma25'|'above_ma99'|'ma7_above_ma25'|'ma25_above_ma99'|'bullish'|'bearish'|'rsi_above_50'|'rsi_above_60'|'rsi_above_70'|'rsi_below_30'|'positive_24h'
export interface Ratio { count:number; total:number; percentage:number }
export interface Snapshot { at:string; participation:{advancing:number;declining:number;unchanged:number;total:number;advanceDeclineRatio:number|null;netAdvance:number}; positive24h:Ratio;positive7d:Ratio;trend:{aboveMA7:Ratio;aboveMA25:Ratio;aboveMA99:Ratio;ma7AboveMA25:Ratio;ma25AboveMA99:Ratio;bullish:Ratio;mixed:Ratio;bearish:Ratio};momentum:{rsiAbove50:Ratio;rsiAbove60:Ratio;rsiAbove70:Ratio;rsiBelow30:Ratio};scores:{breadthScore:number;components:{trend:number;momentum:number;participation:number}} }
export interface BreadthResponse { universe:string;timeframe:BreadthTimeframe;snapshot:Snapshot;breadthMomentum:{oneDay:number;sevenDay:number};btc:{price:number;change24h:number;breadthChange7d:number;summary:string};warnings:string[];coverage:{universeCoins:number;ma99Valid:number;excludedCoins:number} }
export interface HistoryPoint {date:string;breadthScore:number;aboveMA25:number;aboveMA99:number;rsiAbove50:number;positiveCoins:number;advancing:number;declining:number}
export interface HistoryResponse {points:HistoryPoint[];warnings:string[]}
export interface MetricCoin {id:string;symbol:string;name:string;currentPrice:number;change24h:number|null;metricValue:number}
export const getMarketBreadth=()=>http.get<BreadthResponse>('/market-breadth')
export const getMarketBreadthHistory=(period:BreadthPeriod)=>http.get<HistoryResponse>(`/market-breadth/history?period=${period}`)
export const getMarketBreadthCoins=(metric:BreadthMetric)=>http.get<MetricCoin[]>(`/market-breadth/coins?metric=${metric}`)
