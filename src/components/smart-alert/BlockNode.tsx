import { Handle, Position } from 'reactflow';
import {
    DollarSign,
    Gauge,
    TrendingUp,
    CandlestickChart,
    Waves,
    Columns2,
    Bell,
    Webhook,
    HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Tailwind color mapping for block types
const blockConfig = {
    price_condition: {
        icon: DollarSign,
        colorClass: 'text-emerald-500',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'group-hover:border-emerald-500/50'
    },
    relative_strength_index: {
        icon: Gauge,
        colorClass: 'text-orange-500',
        bgClass: 'bg-orange-500/10',
        borderClass: 'group-hover:border-orange-500/50'
    },
    moving_average: {
        icon: TrendingUp,
        colorClass: 'text-purple-500',
        bgClass: 'bg-purple-500/10',
        borderClass: 'group-hover:border-purple-500/50'
    },
    exponential_moving_average: {
        icon: CandlestickChart,
        colorClass: 'text-indigo-500',
        bgClass: 'bg-indigo-500/10',
        borderClass: 'group-hover:border-indigo-500/50'
    },
    bollinger_bands_analysis: {
        icon: Waves,
        colorClass: 'text-pink-500',
        bgClass: 'bg-pink-500/10',
        borderClass: 'group-hover:border-pink-500/50'
    },
    donchian_channel_analysis: {
        icon: Columns2,
        colorClass: 'text-cyan-500',
        bgClass: 'bg-cyan-500/10',
        borderClass: 'group-hover:border-cyan-500/50'
    },
    notification: {
        icon: Bell,
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500/10',
        borderClass: 'group-hover:border-red-500/50'
    },
    webhook: {
        icon: Webhook,
        colorClass: 'text-slate-500',
        bgClass: 'bg-slate-500/10',
        borderClass: 'group-hover:border-slate-500/50'
    },
};

const BlockNode = ({ data, isConnectable }: any) => {
    // Determine configuration based on block type
    const blockType = data.blockType as keyof typeof blockConfig;
    const config = blockConfig[blockType] || {
        icon: HelpCircle,
        colorClass: 'text-muted-foreground',
        bgClass: 'bg-muted/50',
        borderClass: 'group-hover:border-muted-foreground/50'
    };

    // Icon component
    const Icon = config.icon || HelpCircle;

    return (
        <div className={cn(
            "group relative min-w-[200px] rounded-xl border bg-card shadow-sm transition-all duration-200",
            "hover:shadow-lg hover:-translate-y-1",
            config.borderClass
        )}>
            {/* Order Badge */}
            {data.order && (
                <div className="absolute -top-2 -left-2 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-background">
                    {data.order}
                </div>
            )}

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background transition-colors hover:!bg-primary"
            />

            {/* Header */}
            <div className={cn(
                "flex items-center gap-3 p-3 border-b border-border/50 rounded-t-xl transition-colors",
                config.bgClass
            )}>
                <div className={cn("p-1.5 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm", config.colorClass)}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-foreground truncate">{data.label}</span>
            </div>

            {/* Body */}
            <div className="p-3 text-xs text-muted-foreground space-y-2">
                {data.config?.symbol && [
                    'price_condition',
                    'relative_strength_index',
                    'moving_average',
                    'exponential_moving_average',
                    'bollinger_bands_analysis',
                    'donchian_channel_analysis'
                ].includes(data.blockType) ? (
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Symbol</span>
                        <span className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">{data.config.symbol}</span>
                    </div>
                ) : null}

                {data.config?.price !== undefined && data.config?.price !== '' && (
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Price</span>
                        <span className="text-foreground font-mono">{data.config.operator || ''} ${data.config.price}</span>
                    </div>
                )}

                {data.config?.index !== undefined && data.config?.index !== '' && (
                    <div className="flex items-center justify-between">
                        <span className="font-medium">RSI Period</span>
                        <span className="text-foreground font-mono">{data.config.operator || ''} {data.config.index}</span>
                    </div>
                )}

                {data.config?.bandwidth !== undefined && data.config?.bandwidth !== '' && (
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Bandwidth</span>
                        <span className="text-foreground font-mono">{data.config.bandwidth_operator || ''} {data.config.bandwidth}%</span>
                    </div>
                )}

                {data.config?.comparisons && Array.isArray(data.config.comparisons) && data.config.comparisons.length > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Conditions</span>
                        <span className="text-foreground font-mono">{data.config.comparisons.length} rules</span>
                    </div>
                )}

                {/* Show placeholder if no config displayed */}
                {!data.config?.symbol &&
                    data.config?.price === undefined &&
                    data.config?.index === undefined &&
                    !data.config?.bandwidth &&
                    (!data.config?.comparisons || data.config.comparisons.length === 0) && (
                        <div className="text-center italic opacity-40 py-1">
                            Not configured
                        </div>
                    )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background transition-colors hover:!bg-primary"
            />
        </div>
    );
};

export default BlockNode;