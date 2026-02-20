/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { AlertCircle, X, Check, Trash2, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { Definition } from "@/services/mosaicService.ts";
import PriceCondition from "@/components/smart-alert/fields/PriceCondition.tsx";
import Notification from "@/components/smart-alert/fields/Notification.tsx";
import RsiAnalysis from "@/components/smart-alert/fields/RsiAnalysis.tsx";
import MovingAverage from "@/components/smart-alert/fields/MovingAverage.tsx";
import ExponentialMovingAverage from "@/components/smart-alert/fields/ExponentialMovingAverage.tsx";
import BollingerBands from "@/components/smart-alert/fields/BollingerBands.tsx";
import DonchianChannel from "@/components/smart-alert/fields/DonchianChannel.tsx";

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
    definitions: Definition[];
}

const ConfigPanel = ({ node, onClose, onSave, onDelete, definitions }: ConfigPanelProps) => {
    const [config, setConfig] = useState<any>(node?.data?.config || {});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const priceCondition: Definition | undefined = definitions.find(d => d.name === 'price_condition');
    const rsiAnalysis: Definition | undefined = definitions.find(d => d.name === 'rsi_analysis');
    const movingAverage: Definition | undefined = definitions.find(d => d.name === 'ma_analysis');
    const ema: Definition | undefined = definitions.find(d => d.name === 'ema_analysis');
    const bollingerBands: Definition | undefined = definitions.find(d => d.name === 'bollinger_bands_analysis');
    const donchianChannel: Definition | undefined = definitions.find(d => d.name === 'donchian_channel_analysis');

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

    const handleDeleteConfirmed = () => {
        onDelete(node.id);
        setShowDeleteConfirm(false);
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
                return PriceCondition({ renderField, config, handleChange, priceCondition });
            case 'notification':
                return Notification({ renderField, config, handleChange });
            case 'relative_strength_index':
                return RsiAnalysis({ renderField, config, handleChange, rsiAnalysis });
            case 'moving_average':
                return MovingAverage({ renderField, config, handleChange, movingAverage });
            case 'exponential_moving_average':
                return ExponentialMovingAverage({ renderField, config, handleChange, ema });
            case 'bollinger_bands_analysis':
                return BollingerBands({ renderField, config, handleChange, bollingerBands });
            case 'donchian_channel_analysis':
                return DonchianChannel({ renderField, config, handleChange, donchianChannel });
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
        <Card className="relative w-full max-h-full shadow-2xl border bg-card/95 backdrop-blur-md flex flex-col animate-in slide-in-from-right-10 duration-200 rounded-xl overflow-hidden">
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

            <CardContent className="overflow-y-auto p-5 space-y-5">
                {renderFields()}
            </CardContent>

            {showDeleteConfirm && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl animate-in fade-in-0 duration-150">
                    <Card className="w-[85%] shadow-2xl border bg-card/95 backdrop-blur-md animate-in zoom-in-95 duration-200 rounded-xl overflow-hidden">
                        <CardHeader className="border-b p-3 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-destructive/10">
                                    <TriangleAlert className="w-4 h-4 text-destructive" />
                                </div>
                                <CardTitle className="text-sm font-semibold">Delete Block</CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="h-6 w-6 rounded-full hover:bg-muted/80 shrink-0"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete{' '}
                                <span className="font-semibold text-foreground">{node.data.label}</span>?
                                This action cannot be undone.
                            </p>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/20 p-2 flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs rounded-md"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs gap-1.5 rounded-md"
                                onClick={handleDeleteConfirmed}
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            <CardFooter className="border-t bg-muted/20 p-2 flex gap-2 shrink-0 justify-between">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                    onClick={() => setShowDeleteConfirm(true)}
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