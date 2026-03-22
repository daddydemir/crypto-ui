import React from "react"
import { type Alert } from "@/services/alertService"
import { Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { useTranslation } from "react-i18next"

interface AlertRowProps {
    alert: Alert
    onEdit: (alert: Alert) => void
    onDelete: (id: number) => void
    onToggleStatus: (id: number, isActive: boolean) => void
}

const AlertRow: React.FC<AlertRowProps> = ({ alert, onEdit, onDelete, onToggleStatus }) => {
    const { t } = useTranslation()

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <tr className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {alert.Coin.substring(0, 2)}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{alert.Coin}</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-semibold">
                        ${alert.Price.toFixed(2)}
                    </span>
                    {alert.livePrice && (
                        <div className="flex flex-col">
                            <span className={`font-mono text-sm font-medium ${alert.livePrice > alert.Price ? 'text-green-500' : alert.livePrice < alert.Price ? 'text-red-500' : 'text-gray-500'}`}>
                                (${alert.livePrice.toFixed(2)})
                            </span>
                            <span className={`text-[10px] font-bold ${alert.livePrice > alert.Price ? 'text-green-600' : alert.livePrice < alert.Price ? 'text-red-600' : 'text-gray-400'}`}>
                                {alert.livePrice > alert.Price ? '+' : ''}{(((alert.livePrice - alert.Price) / alert.Price) * 100).toFixed(2)}%
                            </span>
                        </div>
                    )}
                </div>
            </td>
            <td className="p-4">
                <div className={`flex items-center gap-2 ${alert.IsAbove ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {alert.IsAbove ? (
                        <>
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-medium">{t("alarms.above")}</span>
                        </>
                    ) : (
                        <>
                            <TrendingDown className="w-5 h-5" />
                            <span className="font-medium">{t("alarms.below")}</span>
                        </>
                    )}
                </div>
            </td>
            <td className="p-4">
                <button
                    onClick={() => onToggleStatus(alert.ID, !alert.IsActive)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${alert.IsActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    {alert.IsActive ? t("alarms.active") : t("alarms.inactive")}
                </button>
            </td>
            <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(alert.CreateDate)}
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(alert)}
                        className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        title={t("alarms.edit")}
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(alert.ID)}
                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                        title={t("alarms.delete")}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    )
}

export default AlertRow
