import type { PortfolioTransaction } from "@/services/portfolioService"

export interface ActivePortfolioPosition {
    baseAsset: string
    quoteAsset: string
    quantity: number
    averageCost: number
    costBasis: number
    buyCount: number
    platforms: string[]
}

interface PositionAccumulator {
    baseAsset: string
    quoteAsset: string
    quantity: number
    costBasis: number
    buyCount: number
    platforms: Set<string>
}

const EPSILON = 1e-10

export function calculateActivePositions(transactions: PortfolioTransaction[]): ActivePortfolioPosition[] {
    const positions = new Map<string, PositionAccumulator>()
    const chronological = [...transactions].sort((left, right) =>
        new Date(left.tradedAt).getTime() - new Date(right.tradedAt).getTime(),
    )

    chronological.forEach(transaction => {
        const baseAsset = transaction.baseAsset.toUpperCase()
        const quoteAsset = transaction.quoteAsset.toUpperCase()
        const key = `${baseAsset}/${quoteAsset}`
        const position = positions.get(key) ?? {
            baseAsset,
            quoteAsset,
            quantity: 0,
            costBasis: 0,
            buyCount: 0,
            platforms: new Set<string>(),
        }

        position.platforms.add(transaction.platform)
        if (transaction.transactionType === "BUY") {
            const receivedQuantity = transaction.receivedAmount - (transaction.feeAsset === baseAsset ? transaction.feeAmount : 0)
            const paidAmount = transaction.spentAmount + (transaction.feeAsset === quoteAsset ? transaction.feeAmount : 0)
            position.quantity += receivedQuantity
            position.costBasis += paidAmount
            position.buyCount += 1
        } else if (position.quantity > EPSILON) {
            const averageCost = position.costBasis / position.quantity
            const soldQuantity = transaction.spentAmount + (transaction.feeAsset === baseAsset ? transaction.feeAmount : 0)
            const removedQuantity = Math.min(soldQuantity, position.quantity)
            position.quantity -= removedQuantity
            position.costBasis -= removedQuantity * averageCost
            if (position.quantity <= EPSILON) {
                position.quantity = 0
                position.costBasis = 0
            }
        }

        positions.set(key, position)
    })

    return [...positions.values()]
        .filter(position => position.quantity > EPSILON)
        .map(position => ({
            baseAsset: position.baseAsset,
            quoteAsset: position.quoteAsset,
            quantity: position.quantity,
            averageCost: position.costBasis / position.quantity,
            costBasis: position.costBasis,
            buyCount: position.buyCount,
            platforms: [...position.platforms].sort(),
        }))
        .sort((left, right) => left.baseAsset.localeCompare(right.baseAsset) || left.quoteAsset.localeCompare(right.quoteAsset))
}
