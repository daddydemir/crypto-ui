import { http } from './api/httpClient'

export type PurchaseStatus = 'WANTED' | 'SAVING' | 'READY' | 'PURCHASED' | 'CANCELLED'
export type PurchasePriority = 'MUST_HAVE' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SOMEDAY'
export interface PriceHistory { id:number; itemId:number; price:number; currency:string; date:string }
export interface SavingTransaction { id:number; goalId:number; amount:number; date:string; note:string; createdAt:string; updatedAt:string }
export interface PurchaseItem { id:number; goalId:number; name:string; description:string; currentPrice:number; targetPrice:number|null; currency:string; imageUrl:string; productUrl:string; category:string; priority:PurchasePriority; status:PurchaseStatus; targetDate:string|null; imageFit:'COVER'|'CONTAIN'; imagePositionX:number; imagePositionY:number; imageZoom:number; actualPurchasePrice:number|null; purchasedAt:string|null; priceHistory:PriceHistory[]; createdAt:string; updatedAt:string }
export interface PurchaseGoal { id:number; name:string; notes:string; currency:string; priority:PurchasePriority; status:PurchaseStatus; displayStatus:PurchaseStatus; targetDate:string|null; expectedMonthlySaving:number; items:PurchaseItem[]; savings:SavingTransaction[]; targetAmount:number; savedAmount:number; remainingAmount:number; remainingItemValue:number; purchasedValue:number; progress:number; estimatedMonths:number|null; createdAt:string; updatedAt:string }
export type NewGoal = Pick<PurchaseGoal,'name'|'notes'|'currency'|'priority'|'targetDate'|'expectedMonthlySaving'> & { items: Partial<PurchaseItem>[] }
export const purchaseGoalsApi = {
  list:()=>http.get<PurchaseGoal[]>('/purchase-goals'), get:(id:number)=>http.get<PurchaseGoal>(`/purchase-goals/${id}`),
  create:(v:NewGoal)=>http.post<PurchaseGoal>('/purchase-goals',v), update:(id:number,v:Partial<PurchaseGoal>)=>http.put<PurchaseGoal>(`/purchase-goals/${id}`,v), remove:(id:number)=>http.delete<void>(`/purchase-goals/${id}`), cancel:(id:number)=>http.post<PurchaseGoal>(`/purchase-goals/${id}/cancel`,{}),
  addItem:(goalId:number,v:Partial<PurchaseItem>)=>http.post<PurchaseGoal>(`/purchase-goals/${goalId}/items`,v), updateItem:(id:number,v:Partial<PurchaseItem>)=>http.put<PurchaseGoal>(`/purchase-items/${id}`,v), removeItem:(id:number)=>http.delete<void>(`/purchase-items/${id}`), cancelItem:(id:number)=>http.post<PurchaseGoal>(`/purchase-items/${id}/cancel`,{}),
  updatePrice:(id:number,price:number,date:string)=>http.post<PurchaseGoal>(`/purchase-items/${id}/price`,{price,date}), purchase:(id:number,actualPurchasePrice:number,purchaseDate:string)=>http.post<PurchaseGoal>(`/purchase-items/${id}/purchase`,{actualPurchasePrice,purchaseDate}),
  addSaving:(goalId:number,v:Pick<SavingTransaction,'amount'|'date'|'note'>)=>http.post<PurchaseGoal>(`/purchase-goals/${goalId}/savings`,v), updateSaving:(goalId:number,id:number,v:Pick<SavingTransaction,'amount'|'date'|'note'>)=>http.put<PurchaseGoal>(`/purchase-goals/${goalId}/savings/${id}`,v), deleteSaving:(goalId:number,id:number)=>http.delete<PurchaseGoal>(`/purchase-goals/${goalId}/savings/${id}`),
}
