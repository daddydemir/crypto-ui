/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
    DollarSign,
    Gauge,
    TrendingUp,
    CandlestickChart,
    Waves,
    Columns2,
    Bell,
    Webhook,
    GripVertical,
    Plus,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const blockTypes = [
    { type: 'price_condition', label: 'Price Alert', icon: DollarSign, category: 'trigger', colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
    { type: 'relative_strength_index', label: 'RSI', icon: Gauge, category: 'indicator', colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
    { type: 'moving_average', label: 'Moving Average', icon: TrendingUp, category: 'indicator', colorClass: 'text-purple-500', bgClass: 'bg-purple-500/10' },
    { type: 'exponential_moving_average', label: 'Exponential Moving Average', icon: CandlestickChart, category: 'indicator', colorClass: 'text-indigo-500', bgClass: 'bg-indigo-500/10' },
    { type: 'bollinger_bands_analysis', label: 'Bollinger Bands', icon: Waves, category: 'indicator', colorClass: 'text-pink-500', bgClass: 'bg-pink-500/10' },
    { type: 'donchian_channel_analysis', label: 'Donchian Channels', icon: Columns2, category: 'indicator', colorClass: 'text-cyan-500', bgClass: 'bg-cyan-500/10' },
    { type: 'notification', label: 'Notification', icon: Bell, category: 'action', colorClass: 'text-red-500', bgClass: 'bg-red-500/10' },
    { type: 'webhook', label: 'Webhook', icon: Webhook, category: 'action', colorClass: 'text-slate-500', bgClass: 'bg-slate-500/10' },
];

const BlockSidebar = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const onDragStart = (event: React.DragEvent, blockType: string) => {
        event.dataTransfer.setData('application/reactflow', blockType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
            <Button
                variant={isOpen ? "secondary" : "default"}
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "pointer-events-auto h-10 w-10 rounded-full shadow-lg transition-all duration-300",
                    isOpen ? "rotate-90 bg-muted text-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
            >
                {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </Button>

            {isOpen && (
                <div
                    className={cn(
                        "pointer-events-auto flex flex-col gap-4 overflow-hidden transition-all duration-300 ease-in-out bg-card/95 backdrop-blur-sm border border-border shadow-xl rounded-xl p-4 w-64 max-h-[70vh]",
                        "animate-in fade-in slide-in-from-top-4 duration-200"
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-foreground">{t('smartAlert.blockSidebar.addBlocks')}</h3>
                    </div>

                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {['trigger', 'indicator', 'action'].map((category) => {
                            const categoryBlocks = blockTypes.filter(b => b.category === category);
                            if (categoryBlocks.length === 0) return null;

                            return (
                                <div key={category}>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        {category === 'trigger' ? t('smartAlert.blockSidebar.triggers') :
                                            category === 'indicator' ? t('smartAlert.blockSidebar.indicators') :
                                                t('smartAlert.blockSidebar.actions')}
                                    </h4>
                                    <div className="space-y-2">
                                        {categoryBlocks.map((block) => (
                                            <div
                                                key={block.type}
                                                className={cn(
                                                    "group flex items-center gap-3 p-2 rounded-lg border border-transparent bg-muted/30 hover:bg-accent/50 hover:border-border cursor-grab active:cursor-grabbing transition-all duration-200",
                                                    "shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                                )}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, block.type)}
                                            >
                                                <div className={cn("p-1.5 rounded-md", block.bgClass)}>
                                                    <block.icon className={cn("w-3.5 h-3.5", block.colorClass)} />
                                                </div>
                                                <span className="text-xs font-medium text-foreground">{t(`smartAlert.blockSidebar.types.${block.type}` as any)}</span>
                                                <GripVertical className="w-3 h-3 text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockSidebar;