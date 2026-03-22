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
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1">{t("alarms.title")}</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        {t("alarms.createNew")}
                    </button>
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