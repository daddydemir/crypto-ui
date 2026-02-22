import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import { cn } from '../../lib/utils';
import { validateNodeConfig } from './validation.ts';
import { MOSAIC_BASE_URL } from '../../services/api/config';

interface SaveButtonProps {
    nodes: any[];
    edges: any[];
    onSave?: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ nodes, edges, onSave }) => {
    const [name, setName] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState<{ field: string; message: string }[] | null>(null);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Lütfen bir isim girin');
            return;
        }

        setLoading(true);
        setServerErrors(null);

        // 1. Individual block validation
        const allValidationErrors: { field: string; message: string }[] = [];
        nodes.forEach(node => {
            const nodeErrors = validateNodeConfig(node.data.blockType, node.data.config || {});
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
                    field: 'Bağlantı Hatası',
                    message: `Birden fazla blok varken bütün bloklar birbirine bağlı olmalıdır. Bağlantısız bloklar: ${nodeNames}.`
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
            blocks: nodes.map(node => ({
                order: node.data.order,
                type: typeMapping[node.data.blockType as string] || node.data.blockType,
                config: node.data.config,
                connection: (() => {
                    const targetId = edges.find(edge => edge.source === node.id)?.target;
                    return targetId ? (nodes.find(n => n.id === targetId)?.data?.order ?? null) : null;
                })()
            }))
        };

        try {
            const response = await fetch(`${MOSAIC_BASE_URL}/mosaic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mosaic)
            });

            if (response.ok) {
                // Ideally replace with a toast
                alert('Mosaic saved successfully!');
                setShowDialog(false);
                setName('');
                onSave?.();
            } else {
                const errorData = await response.json();
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    setServerErrors(errorData.errors);
                } else {
                    alert(`Error: ${errorData.message || 'Unknown error occurred'}`);
                }
            }
        } catch (error) {
            alert('Failed to save mosaic');
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
                Save Mosaic
            </button>

            <Modal
                isOpen={showDialog}
                onClose={() => {
                    setShowDialog(false);
                    setServerErrors(null);
                }}
                title="Save Mosaic"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    {serverErrors && (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-xs font-semibold text-destructive mb-1 uppercase tracking-wider">Validation Errors</h4>
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
                            Mosaic Name
                        </label>
                        <input
                            id="mosaic-name"
                            type="text"
                            placeholder="Enter a descriptive name..."
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
                            Cancel
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
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default SaveButton;