import { useState, useEffect } from 'react';
import { AlertCircle, X, Check, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Removed Label import as it was causing errors and we use a local component

// Fallback Label component if it doesn't exist (I'll check just in case, but assume native label with classes is safer)
const LabelComponent = ({ className, children, ...props }: React.ComponentProps<"label">) => (
    <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props}>
        {children}
    </label>
);


interface ConfigPanelProps {
    node: any;
    onClose: () => void;
    onSave: (id: string, config: any) => void;
    onDelete: (id: string) => void;
}

const ConfigPanel = ({ node, onClose, onSave, onDelete }: ConfigPanelProps) => {
    const [config, setConfig] = useState<any>(node?.data?.config || {});

    // Check if dirty (changes made) could be useful for UI feedback, but strict comparison is hard.
    // For now, simple state is enough.

    useEffect(() => {
        setConfig(node?.data?.config || {});
    }, [node]);

    const handleChange = (key: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(node.id, config);
        onClose();
    };

    if (!node) return null;

    const renderField = (label: string, children: React.ReactNode) => (
        <div className="grid w-full items-center gap-2 mb-4">
            <LabelComponent>{label}</LabelComponent>
            {children}
        </div>
    );

    const renderFields = () => {
        switch (node.data.blockType) {
            case 'price_condition':
                return (
                    <div className="space-y-4">
                        {renderField('Symbol', (
                            <Input
                                type="text"
                                value={config.symbol || ''}
                                onChange={(e) => handleChange('symbol', e.target.value)}
                                placeholder="BTC/USDT"
                                className="font-mono uppercase transition-all focus:scale-[1.01]"
                            />
                        ))}
                        {renderField('Operator', (
                            <Select
                                value={config.operator || '>'}
                                onValueChange={(val) => handleChange('operator', val)}
                            >
                                <SelectTrigger className="transition-all hover:bg-muted/50">
                                    <SelectValue placeholder="Select operator" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=">">Greater than (&gt;)</SelectItem>
                                    <SelectItem value="<">Less than (&lt;)</SelectItem>
                                    <SelectItem value=">=">Greater or equal (&gt;=)</SelectItem>
                                    <SelectItem value="<=">Less or equal (&lt;=)</SelectItem>
                                    <SelectItem value="==">Equal (==)</SelectItem>
                                </SelectContent>
                            </Select>
                        ))}
                        {renderField('Price Target', (
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">$</span>
                                <Input
                                    type="number"
                                    className="pl-7 font-mono transition-all focus:scale-[1.01]"
                                    value={config.price || ''}
                                    onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                                    placeholder="50000"
                                />
                            </div>
                        ))}
                    </div>
                );

            case 'notification':
                return (
                    <div className="space-y-4">
                        {renderField('Channel', (
                            <Select
                                value={config.channel || 'telegram'}
                                onValueChange={(val) => handleChange('channel', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select channel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="telegram">Telegram</SelectItem>
                                    <SelectItem value="discord">Discord</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                            </Select>
                        ))}
                        {renderField('Target User/Group', (
                            <Input
                                type="text"
                                value={config.target || ''}
                                onChange={(e) => handleChange('target', e.target.value)}
                                placeholder="@username or email"
                                className="transition-all focus:scale-[1.01]"
                            />
                        ))}
                        {renderField('Message', (
                            <textarea
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all focus:scale-[1.01]"
                                value={config.message || ''}
                                onChange={(e) => handleChange('message', e.target.value)}
                                placeholder="Alert message..."
                            />
                        ))}
                    </div>
                );

            case 'volume_condition':
                return (
                    <div className="space-y-4">
                        {renderField('Symbol', (
                            <Input
                                type="text"
                                value={config.symbol || ''}
                                onChange={(e) => handleChange('symbol', e.target.value)}
                                placeholder="BTC/USDT"
                                className="font-mono uppercase transition-all focus:scale-[1.01]"
                            />
                        ))}
                        {renderField('Threshold', (
                            <Input
                                type="number"
                                value={config.threshold || ''}
                                onChange={(e) => handleChange('threshold', parseFloat(e.target.value))}
                                placeholder="1000000"
                                className="font-mono transition-all focus:scale-[1.01]"
                            />
                        ))}
                        {renderField('Period', (
                            <Select
                                value={config.period || '24h'}
                                onValueChange={(val) => handleChange('period', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1h">1 Hour</SelectItem>
                                    <SelectItem value="4h">4 Hours</SelectItem>
                                    <SelectItem value="24h">24 Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        ))}
                    </div>
                );

            case 'rsi':
                return (
                    <div className="space-y-4">
                        {renderField('Symbol', (
                            <Input
                                type="text"
                                value={config.symbol || ''}
                                onChange={(e) => handleChange('symbol', e.target.value)}
                                placeholder="BTC/USDT"
                                className="font-mono uppercase transition-all focus:scale-[1.01]"
                            />
                        ))}
                        {renderField('Period', (
                            <Input
                                type="number"
                                value={config.period || 14}
                                onChange={(e) => handleChange('period', parseInt(e.target.value))}
                                placeholder="14"
                                className="font-mono transition-all focus:scale-[1.01]"
                            />
                        ))}
                        <div className="grid grid-cols-2 gap-4">
                            {renderField('Overbought', (
                                <Input
                                    type="number"
                                    value={config.overbought || 70}
                                    onChange={(e) => handleChange('overbought', parseInt(e.target.value))}
                                    placeholder="70"
                                />
                            ))}
                            {renderField('Oversold', (
                                <Input
                                    type="number"
                                    value={config.oversold || 30}
                                    onChange={(e) => handleChange('oversold', parseInt(e.target.value))}
                                    placeholder="30"
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'moving_average':
                return (
                    <div className="space-y-4">
                        {renderField('Symbol', (
                            <Input
                                type="text"
                                value={config.symbol || ''}
                                onChange={(e) => handleChange('symbol', e.target.value)}
                                placeholder="BTC/USDT"
                                className="font-mono uppercase transition-all focus:scale-[1.01]"
                            />
                        ))}
                        {renderField('Type', (
                            <Select
                                value={config.type || 'sma'}
                                onValueChange={(val) => handleChange('type', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sma">Simple (SMA)</SelectItem>
                                    <SelectItem value="ema">Exponential (EMA)</SelectItem>
                                    <SelectItem value="wma">Weighted (WMA)</SelectItem>
                                </SelectContent>
                            </Select>
                        ))}
                        {renderField('Length', (
                            <Input
                                type="number"
                                value={config.length || 20}
                                onChange={(e) => handleChange('length', parseInt(e.target.value))}
                                placeholder="20"
                                className="font-mono transition-all focus:scale-[1.01]"
                            />
                        ))}
                    </div>
                );

            case 'webhook':
                return (
                    <div className="space-y-4">
                        {renderField('URL', (
                            <Input
                                type="url"
                                value={config.url || ''}
                                onChange={(e) => handleChange('url', e.target.value)}
                                placeholder="https://api.example.com/webhook"
                                className="transition-all focus:scale-[1.01]"
                            />
                        ))}
                        {renderField('Method', (
                            <Select
                                value={config.method || 'POST'}
                                onValueChange={(val) => handleChange('method', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                </SelectContent>
                            </Select>
                        ))}
                        {renderField('Body (JSON)', (
                            <textarea
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono transition-all focus:scale-[1.01]"
                                value={config.body || ''}
                                onChange={(e) => handleChange('body', e.target.value)}
                                placeholder='{"key": "value"}'
                            />
                        ))}
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-center animate-in fade-in-50">
                        <AlertCircle className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No configuration options available</p>
                        <p className="text-xs text-muted-foreground/75 mt-1">This block type doesn't have any configurable parameters.</p>
                    </div>
                );
        }
    };

    return (
        <Card className="w-full max-h-full shadow-2xl border bg-card/95 backdrop-blur-md flex flex-col animate-in slide-in-from-right-10 duration-200 rounded-xl overflow-hidden">
            <CardHeader className="border-b p-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className={cn(
                        "w-2 h-8 rounded-full shrink-0",
                        node.data.category === 'trigger' ? "bg-emerald-500" :
                            node.data.category === 'action' ? "bg-red-500" : "bg-blue-500"
                    )} />
                    <div className="overflow-hidden">
                        <CardTitle className="text-sm font-semibold truncate">{node.data.label}</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{node.data.blockType}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full hover:bg-muted/80 shrink-0">
                    <X className="h-3.5 w-3.5" />
                </Button>
            </CardHeader>

            <CardContent className="overflow-y-auto p-4 space-y-4">
                {renderFields()}
            </CardContent>

            <CardFooter className="border-t bg-muted/20 p-2 flex gap-2 shrink-0 justify-between">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                    onClick={() => {
                        if (confirm('Are you sure you want to delete this block?')) {
                            onDelete(node.id);
                        }
                    }}
                    title="Delete Block"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <div className="flex gap-2 flex-1 justify-end">
                    <Button variant="outline" size="sm" className="h-7 text-xs rounded-md" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs gap-1.5 rounded-md" onClick={handleSave}>
                        <Check className="w-3 h-3" />
                        Save
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default ConfigPanel;