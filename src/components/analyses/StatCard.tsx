import React, { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
    label: string
    value: string | number
    change?: number
    changeValue?: string
    color: 'blue' | 'green' | 'orange' | 'red' | 'purple'
    icon?: ReactNode
}

const colorClasses = {
    blue: {
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800'
    },
    green: {
        text: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800'
    },
    orange: {
        text: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800'
    },
    red: {
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800'
    },
    purple: {
        text: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800'
    }
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    change,
    changeValue,
    color,
    icon
}) => {
    const colors = colorClasses[color]

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-green-600 dark:text-green-400'
        if (change < 0) return 'text-red-600 dark:text-red-400'
        return 'text-gray-600 dark:text-gray-400'
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {label}
                    </div>
                    <div className={`text-3xl font-bold ${colors.text}`}>
                        {value}
                    </div>
                    {change !== undefined && (
                        <div className={`text-sm mt-1 flex items-center gap-1 ${getChangeColor(change)}`}>
                            {change > 0 ? <TrendingUp className="w-4 h-4" /> :
                                change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                            {change > 0 ? '+' : ''}{changeValue || change.toFixed(2)}
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={colors.text}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}

export default StatCard
