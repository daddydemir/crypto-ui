import React from 'react'
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
        { value: '7d', label: t('common.range7d', '7D') },
        { value: '30d', label: t('common.range30d', '30D') },
        { value: '90d', label: t('common.range90d', '90D') },
        { value: '1y', label: t('common.range1y', '1Y') },
        { value: 'all', label: t('common.all', 'All') },
    ]

    return (
        <div className={`range-selector ${className}`} role="group" aria-label={t('common.timeRange', 'Time range')}>
            <div className="range-selector__track">
                {timeRangeButtons.map((btn) => (
                    <button
                        key={btn.value}
                        onClick={() => onChange(btn.value)}
                        aria-pressed={value === btn.value}
                        className={`range-selector__button ${value === btn.value
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
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
