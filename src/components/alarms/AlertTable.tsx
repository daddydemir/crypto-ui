import React from "react"
import { type Alert } from "@/services/alertService"
import AlertRow from "./AlertRow"
import { useTranslation } from "react-i18next"

interface AlertTableProps {
    alerts: Alert[]
    onEdit: (alert: Alert) => void
    onDelete: (id: number) => void
    onToggleStatus: (id: number, isActive: boolean) => void
}

const AlertTable: React.FC<AlertTableProps> = ({ alerts, onEdit, onDelete, onToggleStatus }) => {
    const { t } = useTranslation()

    if (alerts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
                <div className="text-gray-400 dark:text-gray-600 mb-4">
                    <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("alarms.noAlerts")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    {t("alarms.noAlertsDescription")}
                </p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-left text-sm text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs">
                    <tr>
                        <th className="p-4">{t("alarms.coin")}</th>
                        <th className="p-4">{t("alarms.targetPrice")}</th>
                        <th className="p-4">{t("alarms.direction")}</th>
                        <th className="p-4">{t("alarms.status")}</th>
                        <th className="p-4">{t("alarms.createdAt")}</th>
                        <th className="p-4">{t("alarms.actions")}</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.map((alert) => (
                        <AlertRow
                            key={alert.ID}
                            alert={alert}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleStatus={onToggleStatus}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default AlertTable
