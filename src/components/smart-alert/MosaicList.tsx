import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserMosaics, deleteMosaic, type Mosaic } from '@/services/mosaicService';
import { Plus, Loader2, Bell, Layers, ChevronRight, Zap, Pencil, Trash2, TriangleAlert } from 'lucide-react';
import {
    DollarSign,
    Gauge,
    TrendingUp,
    CandlestickChart,
    Waves,
    Columns2,
    Webhook,
    HelpCircle
} from 'lucide-react';
import Modal from '../common/Modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

const blockIconMap: Record<string, { icon: any; colorClass: string; bgClass: string }> = {
    price_condition: {
        icon: DollarSign,
        colorClass: 'text-emerald-500',
        bgClass: 'bg-emerald-500/10'
    },
    rsi_analysis: {
        icon: Gauge,
        colorClass: 'text-orange-500',
        bgClass: 'bg-orange-500/10'
    },
    ma_analysis: {
        icon: TrendingUp,
        colorClass: 'text-purple-500',
        bgClass: 'bg-purple-500/10'
    },
    ema_analysis: {
        icon: CandlestickChart,
        colorClass: 'text-indigo-500',
        bgClass: 'bg-indigo-500/10'
    },
    bollinger_bands_analysis: {
        icon: Waves,
        colorClass: 'text-pink-500',
        bgClass: 'bg-pink-500/10'
    },
    donchian_channel_analysis: {
        icon: Columns2,
        colorClass: 'text-cyan-500',
        bgClass: 'bg-cyan-500/10'
    },
    notification: {
        icon: Bell,
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500/10'
    },
    webhook: {
        icon: Webhook,
        colorClass: 'text-slate-500',
        bgClass: 'bg-slate-500/10'
    },
};

const typeDisplayNames: Record<string, string> = {
    price_condition: 'Price Condition',
    rsi_analysis: 'RSI',
    ma_analysis: 'Moving Average',
    ema_analysis: 'Exponential MA',
    bollinger_bands_analysis: 'Bollinger Bands',
    donchian_channel_analysis: 'Donchian Channels',
    notification: 'Notification',
    webhook: 'Webhook',
};

function getBlockInfo(type: string) {
    return blockIconMap[type] || {
        icon: HelpCircle,
        colorClass: 'text-muted-foreground',
        bgClass: 'bg-muted/50'
    };
}

function formatBlockSummary(block: Mosaic['blocks'][0]): string {
    const { type, config } = block;
    if (type === 'price_condition' && config) {
        return `${config.symbol || '?'} ${config.operator || ''} $${config.price ?? '?'}`;
    }
    if (type === 'rsi_analysis' && config) {
        return `${config.symbol || '?'} RSI ${config.operator || ''} ${config.index ?? '?'}`;
    }
    if (config?.symbol) {
        return config.symbol;
    }
    return '';
}

interface MosaicListProps {
    onCreateNew: () => void;
    onEdit: (mosaic: Mosaic) => void;
}

const MosaicList = ({ onCreateNew, onEdit }: MosaicListProps) => {
    const { t } = useTranslation();
    const [mosaics, setMosaics] = useState<Mosaic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [mosaicToDelete, setMosaicToDelete] = useState<Mosaic | null>(null);
    const [deleting, setDeleting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        loadMosaics();
    }, []);

    const loadMosaics = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await getUserMosaics();
            setMosaics(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!mosaicToDelete) return;

        setDeleting(true);
        try {
            await deleteMosaic(mosaicToDelete.Id);
            setMosaics(prev => prev.filter(m => m.Id !== mosaicToDelete.Id));
            setDeleteModalOpen(false);
            setMosaicToDelete(null);
            toast.success(t('common.success', 'İşlem başarılı'));
        } catch (err) {
            console.error('Delete error:', err);
            toast.error(t('common.error'));
        } finally {
            setDeleting(false);
        }
    };

    const confirmDelete = (e: React.MouseEvent, mosaic: Mosaic) => {
        e.stopPropagation(); // Prevents editing to open
        setMosaicToDelete(mosaic);
        setDeleteModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="p-3 bg-destructive/10 rounded-full">
                        <Bell className="w-8 h-8 text-destructive" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('common.error')}</p>
                    <button
                        onClick={loadMosaics}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                        <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">
                            {t('smartAlert.list.title')}
                        </h1>
                    </div>
                </div>
                <button
                    onClick={onCreateNew}
                    className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
                        "hover:shadow-md active:scale-[0.98]"
                    )}
                >
                    <Plus className="w-4 h-4" />
                    {t('smartAlert.list.createNew')}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {mosaics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <div className="p-4 bg-muted/50 rounded-full">
                            <Layers className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-foreground mb-1">
                                {t('smartAlert.list.noAlerts')}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                {t('smartAlert.list.noAlertsDescription')}
                            </p>
                        </div>
                        <button
                            onClick={onCreateNew}
                            className={cn(
                                "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
                                "hover:shadow-md active:scale-[0.98]"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                            {t('smartAlert.list.createFirst')}
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3 max-w-4xl mx-auto">
                        {/* Stats Bar */}
                        <div className="flex items-center justify-between px-1 mb-2">
                            <p className="text-sm text-muted-foreground">
                                {t('smartAlert.list.totalAlerts', { count: mosaics.length })}
                            </p>
                        </div>

                        {/* Mosaic Cards */}
                        {mosaics.map((mosaic) => (
                            <div
                                key={mosaic.Id}
                                onClick={() => onEdit(mosaic)}
                                className={cn(
                                    "group rounded-xl border border-border bg-card p-4 transition-all duration-200",
                                    "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
                                    "cursor-pointer"
                                )}
                            >
                                {/* Card Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-primary/10 rounded-lg">
                                            <Zap className="w-4 h-4 text-primary" />
                                        </div>
                                        <h3 className="font-semibold text-foreground text-sm">
                                            {mosaic.name || t('smartAlert.list.unnamed')}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {mosaic.blocks.length} {mosaic.blocks.length === 1 ? t('smartAlert.list.block') : t('smartAlert.list.blocks')}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => confirmDelete(e, mosaic)}
                                                className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="w-px h-3 bg-border mx-0.5" />
                                            <Pencil className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                {/* Blocks */}
                                <div className="flex flex-wrap gap-2">
                                    {mosaic.blocks
                                        .sort((a, b) => a.order - b.order)
                                        .map((block, idx) => {
                                            const info = getBlockInfo(block.type);
                                            const Icon = info.icon;
                                            const summary = formatBlockSummary(block);

                                            return (
                                                <div key={block.id} className="flex items-center gap-1.5">
                                                    <div
                                                        className={cn(
                                                            "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/50 text-xs",
                                                            info.bgClass
                                                        )}
                                                    >
                                                        <Icon className={cn("w-3.5 h-3.5", info.colorClass)} />
                                                        <span className="font-medium text-foreground">
                                                            {typeDisplayNames[block.type] || block.type}
                                                        </span>
                                                        {summary && (
                                                            <span className="text-muted-foreground font-mono">
                                                                {summary}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {idx < mosaic.blocks.length - 1 && (
                                                        <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => !deleting && setDeleteModalOpen(false)}
                title={t('smartAlert.configPanel.deleteBlock')}
                maxWidth="max-w-md"
            >
                <div className="p-1 space-y-4">
                    <div className="flex items-center gap-3 text-destructive">
                        <div className="p-2 bg-destructive/10 rounded-full">
                            <TriangleAlert className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold">{t('smartAlert.configPanel.deleteBlock')}</h3>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">"{mosaicToDelete?.name || t('smartAlert.list.unnamed')}"</span>
                        {' '}{t('smartAlert.configPanel.confirmDelete1')}
                    </p>

                    <div className="flex gap-3 justify-end mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={deleting}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            {t('common.delete')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MosaicList;
