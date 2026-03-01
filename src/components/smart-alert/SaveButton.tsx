import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import { cn } from '../../lib/utils';
import { validateNodeConfig } from './validation.ts';
import { MOSAIC_BASE_URL } from '../../services/api/config';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/contexts/ToastContext';

interface SaveButtonProps {
    nodes: any[];
    edges: any[];
    mosaicId?: string;
    mosaicName?: string;
    onSave?: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ nodes, edges, mosaicId, mosaicName: initialName, onSave }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(initialName || '');
    const [showDialog, setShowDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState<{ field: string; message: string }[] | null>(null);
    const toast = useToast();

    const handleSave = async () => {
        if (!name.trim()) {
            toast.warning(t('smartAlert.saveButton.enterName'));
            return;
        }

        setLoading(true);
        setServerErrors(null);

        // 1. Individual block validation
        const allValidationErrors: { field: string; message: string }[] = [];
        nodes.forEach(node => {
            const nodeErrors = validateNodeConfig(node.data.blockType, node.data.config || {}, t);
            Object.entries(nodeErrors).forEach(([field, msg]) => {
                allValidationErrors.push({
                    field: `${node.data.label} -> ${field}`,
                    message: msg
                });
            });
        });

        if (allValidationErrors.length > 0) {
            setServerErrors(allValidationErrors);
            setLoading(false);
            return;
        }

        // 2. Local connectivity validation
        if (nodes.length > 1) {
            const unconnectedNodes = nodes.filter(node =>
                !edges.some(edge => edge.source === node.id || edge.target === node.id)
            );

            if (unconnectedNodes.length > 0) {
                const nodeNames = unconnectedNodes.map(n => n.data.label).join(', ');
                setServerErrors([{
                    field: t('smartAlert.saveButton.connectionError'),
                    message: `${t('smartAlert.saveButton.connectionErrorMsg')}${nodeNames}.`
                }]);
                setLoading(false);
                return;
            }
        }

        const typeMapping: Record<string, string> = {
            'relative_strength_index': 'rsi_analysis',
            'moving_average': 'ma_analysis',
            'exponential_moving_average': 'ema_analysis',
        };

        // Transform to backend format
        const mosaic = {
            name: name,
            description: '',
            id: mosaicId,
            blocks: nodes.map(node => {
                // Normalize config: transform flat bandwidth/bandwidth_operator into nested object
                const config = { ...node.data.config };
                if (config.bandwidth !== undefined && config.bandwidth !== '') {
                    config.bandwidth = {
                        symbol: config.symbol || '',
                        value: config.bandwidth,
                        operator: config.bandwidth_operator || '>'
                    };
                    delete config.bandwidth_operator;
                }

                return {
                    id: node.id,
                    order: node.data.order,
                    type: typeMapping[node.data.blockType as string] || node.data.blockType,
                    config,
                    connection: (() => {
                        const targetId = edges.find(edge => edge.source === node.id)?.target;
                        return targetId ? (nodes.find(n => n.id === targetId)?.data?.order ?? null) : null;
                    })()
                };
            })
        };

        try {
            const url = mosaicId
                ? `${MOSAIC_BASE_URL}/mosaic/${mosaicId}`
                : `${MOSAIC_BASE_URL}/mosaic`;
            const method = mosaicId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mosaic)
            });

            if (response.ok) {
                toast.success(t('smartAlert.saveButton.saveSuccess'));
                setShowDialog(false);
                setName('');
                onSave?.();
            } else {
                const errorData = await response.json();
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    setServerErrors(errorData.errors);
                } else {
                    toast.error(`${t('smartAlert.saveButton.error')}${errorData.message || t('smartAlert.saveButton.unknownError')}`);
                }
            }
        } catch (error) {
            toast.error(t('smartAlert.saveButton.saveFailed'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (showDialog) {
            setServerErrors(null);
        }
    }, [showDialog]);

    return (
        <>
            <button
                className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                )}
                onClick={() => setShowDialog(true)}
            >
                <Save className="w-4 h-4" />
                {mosaicId ? t('smartAlert.saveButton.updateMosaic') : t('smartAlert.saveButton.saveMosaic')}
            </button>

            <Modal
                isOpen={showDialog}
                onClose={() => {
                    setShowDialog(false);
                    setServerErrors(null);
                }}
                title={mosaicId ? t('smartAlert.saveButton.updateMosaic') : t('smartAlert.saveButton.saveMosaic')}
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    {serverErrors && (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-xs font-semibold text-destructive mb-1 uppercase tracking-wider">{t('smartAlert.saveButton.validationErrors')}</h4>
                            <ul className="space-y-1">
                                {serverErrors.map((err, i) => (
                                    <li key={i} className="text-[11px] text-destructive flex gap-2">
                                        <span className="font-bold opacity-70">[{err.field}]</span>
                                        <span>{err.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="mosaic-name" className="text-sm font-medium text-foreground">
                            {t('smartAlert.saveButton.mosaicName')}
                        </label>
                        <input
                            id="mosaic-name"
                            type="text"
                            placeholder={t('smartAlert.saveButton.enterDescriptiveName')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={cn(
                                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                                "placeholder:text-muted-foreground",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                "disabled:cursor-not-allowed disabled:opacity-50",
                                serverErrors && "border-destructive/50"
                            )}
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setShowDialog(false)}
                            className="px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                        >
                            {t('smartAlert.saveButton.cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                "bg-primary text-primary-foreground hover:bg-primary/90",
                                "disabled:opacity-50 disabled:pointer-events-none"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('smartAlert.saveButton.saving')}
                                </>
                            ) : (
                                t('smartAlert.saveButton.save')
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default SaveButton;