import React, { useState, useMemo } from "react"
import {
    getAlerts, createAlert, updateAlert, deleteAlert, toggleAlertStatus, type Alert, type CreateAlertDto,
    type UpdateAlertDto
} from "@/services/alertService"
import AlertTable from "@/components/alarms/AlertTable"
import AlertDialog from "@/components/alarms/AlertDialog"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import { useTranslation } from "react-i18next"
import { useCachedData } from "@/hooks/useCachedData"
import RefreshButton from "@/components/common/RefreshButton"
import { Plus } from "lucide-react"
import { useCryptoWebSocket } from "@/hooks/useCryptoWebSocket"

const AlarmsPage: React.FC = () => {
    const { t } = useTranslation()
    const { data: alerts, loading, refreshing, refresh, lastUpdateText } = useCachedData({
        cacheKey: 'alerts',
        fetchFn: getAlerts
    })

    const wsPrices = useCryptoWebSocket()

    const updatedAlerts = useMemo(() => {
        if (!alerts) return []
        if (Object.keys(wsPrices).length === 0) return alerts

        return alerts.map(alert => {
            if (wsPrices[alert.Coin]) {
                return {
                    ...alert,
                    livePrice: wsPrices[alert.Coin]
                }
            }
            return alert
        })
    }, [alerts, wsPrices])

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [deletingAlertId, setDeletingAlertId] = useState<number | null>(null)

    const handleCreateAlert = async (alertData: CreateAlertDto) => {
        const result = await createAlert(alertData)
        if (result) {
            await refresh()
        }
    }

    const handleUpdateAlert = async (alertData: CreateAlertDto) => {
        if (editingAlert) {
            const updateData: UpdateAlertDto = {
                price: alertData.Price,
                isAbove: alertData.IsAbove
            }
            const result = await updateAlert(editingAlert.ID, updateData)
            if (result) {
                await refresh()
            }
        }
    }

    const handleDeleteAlert = (id: number) => {
        setDeletingAlertId(id)
        setDeleteConfirmOpen(true)
    }

    const confirmDelete = async () => {
        if (deletingAlertId) {
            const success = await deleteAlert(deletingAlertId)
            if (success) {
                await refresh()
            }
            setDeletingAlertId(null)
        }
    }

    const handleToggleStatus = async (id: number, isActive: boolean) => {
        const success = await toggleAlertStatus(id, isActive)
        if (success) {
            await refresh()
        }
    }

    const handleEdit = (alert: Alert) => {
        setEditingAlert(alert)
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingAlert(null)
    }

    const handleSaveAlert = async (alertData: CreateAlertDto) => {
        if (editingAlert) {
            await handleUpdateAlert(alertData)
        } else {
            await handleCreateAlert(alertData)
        }
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-shell">
            <div className="page-hero mb-6">
                <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Price monitoring</p>
                    <h1 className="text-3xl font-bold tracking-tight text-white">{t("alarms.title")}</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        {t("alarms.totalAlerts", { count: alerts?.length || 0 })}
                    </p>
                </div>
                <div className="flex items-start gap-3">
                    <RefreshButton
                        onRefresh={refresh}
                        refreshing={refreshing}
                        lastUpdateText={lastUpdateText}
                    />
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="primary-action bg-white text-slate-950 shadow-white/10 hover:bg-indigo-50"
                    >
                        <Plus className="w-5 h-5" />
                        {t("alarms.createNew")}
                    </button>
                </div>
                </div>
            </div>

            <AlertTable
                alerts={updatedAlerts}
                onEdit={handleEdit}
                onDelete={handleDeleteAlert}
                onToggleStatus={handleToggleStatus}
            />

            <AlertDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                onSave={handleSaveAlert}
                editAlert={editingAlert}
            />

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title={t("alarms.deleteAlertTitle")}
                message={t("alarms.deleteAlertMessage")}
                confirmText={t("alarms.delete")}
                variant="danger"
            />
        </div>
    )
}

export default AlarmsPage
