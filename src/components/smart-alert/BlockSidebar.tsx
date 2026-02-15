import React, { useState } from 'react';
import {
    DollarSign,
    BarChart3,
    Activity,
    TrendingUp,
    Bell,
    Webhook,
    GripVertical,
    Plus,
    X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';

const blockTypes = [
    { type: 'price_condition', label: 'Price Alert', icon: DollarSign, category: 'trigger', colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
    { type: 'volume_condition', label: 'Volume Alert', icon: BarChart3, category: 'trigger', colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10' },
    { type: 'rsi', label: 'RSI', icon: Activity, category: 'indicator', colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
    { type: 'moving_average', label: 'Moving Average', icon: TrendingUp, category: 'indicator', colorClass: 'text-purple-500', bgClass: 'bg-purple-500/10' },
    { type: 'notification', label: 'Notification', icon: Bell, category: 'action', colorClass: 'text-red-500', bgClass: 'bg-red-500/10' },
    { type: 'webhook', label: 'Webhook', icon: Webhook, category: 'action', colorClass: 'text-slate-500', bgClass: 'bg-slate-500/10' },
];

const BlockSidebar = () => {
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
                        <h3 className="text-sm font-bold text-foreground">Add Blocks</h3>
                    </div>

                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {['trigger', 'indicator', 'action'].map((category) => {
                            const categoryBlocks = blockTypes.filter(b => b.category === category);
                            if (categoryBlocks.length === 0) return null;

                            return (
                                <div key={category}>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        {category === 'trigger' ? '🎯 Triggers' :
                                            category === 'indicator' ? '📊 Indicators' :
                                                '⚡ Actions'}
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
                                                <span className="text-xs font-medium text-foreground">{block.label}</span>
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