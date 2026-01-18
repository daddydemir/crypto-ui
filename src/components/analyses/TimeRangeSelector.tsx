import React from 'react'
import { Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type TimeRange } from '@/hooks/useTimeRangeFilter'

interface TimeRangeSelectorProps {
    value: TimeRange
    onChange: (value: TimeRange) => void
    className?: string
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
    value,
    onChange,
    className = ''
}) => {
    const { t } = useTranslation()

    const timeRangeButtons: { value: TimeRange; label: string }[] = [
        { value: '7d', label: '7 ' + t('common.days', 'Days') },
        { value: '30d', label: '30 ' + t('common.days', 'Days') },
        { value: '90d', label: '90 ' + t('common.days', 'Days') },
        { value: '1y', label: '1 ' + t('common.year', 'Year') },
        { value: 'all', label: t('common.all', 'All') },
    ]

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex gap-1 flex-wrap">
                {timeRangeButtons.map((btn) => (
                    <button
                        key={btn.value}
                        onClick={() => onChange(btn.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${value === btn.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default TimeRangeSelector
