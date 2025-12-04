import React, { useState, useEffect } from "react"
import { type Alert, type CreateAlertDto } from "@/services/alertService"
import { X, TrendingUp, TrendingDown } from "lucide-react"
import { useTranslation } from "react-i18next"

interface AlertDialogProps {
    isOpen: boolean
    onClose: () => void
    onSave: (alert: CreateAlertDto) => Promise<void>
    editAlert?: Alert | null
}

const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, onClose, onSave, editAlert }) => {
    const { t } = useTranslation()
    const [coin, setCoin] = useState("")
    const [price, setPrice] = useState("")
    const [isAbove, setIsAbove] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (editAlert) {
            setCoin(editAlert.Coin)
            setPrice(editAlert.Price.toString())
            setIsAbove(editAlert.IsAbove)
        } else {
            setCoin("")
            setPrice("")
            setIsAbove(true)
        }
    }, [editAlert, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!coin.trim() || !price) {
            return
        }

        setSaving(true)
        try {
            await onSave({
                Coin: coin.trim().toUpperCase(),
                Price: parseFloat(price),
                IsAbove: isAbove,
            })
            onClose()
        } catch (error) {
            console.error('Error saving alert:', error)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {editAlert ? t("alarms.editAlert") : t("alarms.createAlert")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("alarms.coinSymbol")}
                        </label>
                        <input
                            type="text"
                            value={coin}
                            onChange={(e) => setCoin(e.target.value.toUpperCase())}
                            placeholder="BTC"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("alarms.targetPrice")}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("alarms.direction")}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAbove(true)}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                                    isAbove
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
                                }`}
                            >
                                <TrendingUp className="w-5 h-5" />
                                <span className="font-medium">{t("alarms.above")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAbove(false)}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                                    !isAbove
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
                                }`}
                            >
                                <TrendingDown className="w-5 h-5" />
                                <span className="font-medium">{t("alarms.below")}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? t("common.saving") : t("common.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AlertDialog
