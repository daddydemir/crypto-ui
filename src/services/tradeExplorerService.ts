import { http } from './api/httpClient'
import type { Condition } from './strategyLabService'

export type TradeRow={id:number;runId:number;strategyId:number;coinSymbol:string;strategyName:string;strategyVersion:number;runType:string;entrySignalDate:string;entryExecutionDate:string;exitSignalDate?:string;exitExecutionDate?:string;entryPrice:number;exitPrice:number;pnl:number;pnlPercent:number;holdingDays:number;totalFees:number;exitReason:string;note:string}
export type TradePage={items:TradeRow[];total:number;page:number;pageSize:number}
export type Snapshot={date:string;values:Record<string,number>;conditions:Array<{condition:Condition;leftValue:number;rightValue:number;matched:boolean}>}
export type Point={date:string;close:number;returnPercent:number;phase:'context'|'trade'}
export type Analysis={chart:Point[];journey:Point[];excursion:{bestPercent:number;worstPercent:number;bestDate?:string;worstDate?:string};postExit:Array<{days:number;returnPercent:number|null}>;bestCloseAfter14?:number;bestCloseAfter14Percent?:number;currentClose?:number;unrealizedPnlPercent?:number;daysOpen:number;calculatedAsOf?:string}
export type TradeDetail={trade:TradeRow;entrySnapshot:Snapshot;exitSnapshot:Snapshot;analysis:Analysis;dailyCloseNotice:string}
export type Statistics={total:number;winners:number;losers:number;open:number;winRate:number;averageReturn:number;averageWinner:number;averageLoser:number;averageHoldingDays:number;averageFees:number}
export type Option={value:string;label:string};export type Options={coins:Option[];strategies:Option[];runs:Option[]}
export type Filters={result?:string;coin?:string;strategyId?:string;runId?:string;runType?:string;from?:string;to?:string;sort?:string;direction?:string;page?:number;pageSize?:number}
const query=(f:Filters)=>{const q=new URLSearchParams();Object.entries(f).forEach(([k,v])=>{if(v!==undefined&&v!=='')q.set(k,String(v))});return q.toString()}
export const tradeExplorerApi={list:(f:Filters)=>http.get<TradePage>(`/trade-explorer/trades?${query(f)}`),detail:(id:number)=>http.get<TradeDetail>(`/trade-explorer/trades/${id}`),statistics:(f:Filters)=>http.get<Statistics>(`/trade-explorer/statistics?${query(f)}`),options:()=>http.get<Options>('/trade-explorer/options'),note:(id:number,note:string)=>http.patch<void>(`/trade-explorer/trades/${id}/note`,{note})}
