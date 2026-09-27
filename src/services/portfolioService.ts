import { http } from "./api/httpClient"

export type TransactionType = "BUY" | "SELL"

export interface PortfolioTransaction {
    id: number
    coinSymbol: string
    transactionType: TransactionType
	baseAsset: string
	quoteAsset: string
	receivedAsset: string
	receivedAmount: number
	spentAsset: string
	spentAmount: number
	usdValue: number
	feeAmount: number
	feeAsset: string
	source: string
	externalTradeId: string
    platform: string
    tradedAt: string
    notes: string
    createdAt: string
    updatedAt: string
}

export type PortfolioTransactionInput = Omit<PortfolioTransaction, "id" | "createdAt" | "updatedAt">

export interface ExchangeTradeSearch { exchange: "BINANCE" | "BINANCE_TR" | "BTCTURK"; baseAsset: string; quoteAsset: string; startDate: string; endDate: string }

export const getPortfolioTransactions = () =>
    http.get<PortfolioTransaction[]>("/portfolio/transactions")

export const createPortfolioTransaction = (transaction: PortfolioTransactionInput) =>
    http.post<PortfolioTransaction>("/portfolio/transactions", transaction)

export const updatePortfolioTransaction = (id: number, transaction: PortfolioTransactionInput) =>
    http.put<PortfolioTransaction>(`/portfolio/transactions/${id}`, transaction)

export const deletePortfolioTransaction = (id: number) =>
    http.delete<void>(`/portfolio/transactions/${id}`)

export const searchExchangeTrades = (query: ExchangeTradeSearch) =>
	http.post<PortfolioTransaction[]>("/portfolio/exchange-trades/search", query)

export const importExchangeTrades = (transactions: PortfolioTransaction[]) =>
	http.post<{ imported: number }>("/portfolio/exchange-trades/import", transactions)
