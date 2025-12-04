import React from "react"
import { AlertTriangle, X } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: "danger" | "warning" | "info"
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = "danger"
}) => {
    const { t } = useTranslation()

    if (!isOpen) return null

    const variantStyles = {
        danger: {
            icon: "text-red-600 dark:text-red-400",
            iconBg: "bg-red-100 dark:bg-red-900/30",
            button: "bg-red-500 hover:bg-red-600 text-white"
        },
        warning: {
            icon: "text-yellow-600 dark:text-yellow-400",
            iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
            button: "bg-yellow-500 hover:bg-yellow-600 text-white"
        },
        info: {
            icon: "text-blue-600 dark:text-blue-400",
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            button: "bg-blue-500 hover:bg-blue-600 text-white"
        }
    }

    const styles = variantStyles[variant]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4 animate-slideUp">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                            <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition"
                    >
                        {cancelText || t("common.cancel")}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition ${styles.button}`}
                    >
                        {confirmText || t("common.confirm", "Confirm")}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
