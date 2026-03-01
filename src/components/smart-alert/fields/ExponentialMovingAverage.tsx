import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import type { Definition } from "@/services/mosaicService.ts";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

const ExponentialMovingAverage = (props: { renderField: any; config: any; handleChange: any; ema: Definition | undefined; errors: any }) => {
    const { t } = useTranslation();
    const conditions = Array.isArray(props.config.comparisons)
        ? props.config.comparisons
        : [
            {
                left: props.config['comparison-1'] || '',
                operator: props.config['operator-1'] || '>',
                right: props.config['comparison-2'] || ''
            }
        ];

    const updateCondition = (index: number, field: string, value: string) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        props.handleChange('comparisons', newConditions);
    };

    const addCondition = () => {
        props.handleChange('comparisons', [
            ...conditions,
            { left: '', operator: '>', right: '' }
        ]);
    };

    const removeCondition = (index: number) => {
        const newConditions = conditions.filter((_: any, i: number) => i !== index);
        props.handleChange('comparisons', newConditions);
    };

    return (
        <div className="space-y-4">
            {props.renderField(t('smartAlert.fields.symbol'), (
                <Input
                    type="text"
                    value={props.config.symbol || ''}
                    onChange={(e) => props.handleChange('symbol', e.target.value)}
                    placeholder="BTC"
                    aria-invalid={!!props.errors.symbol}
                    className="font-mono uppercase transition-all focus:scale-[1.01]"
                />
            ), true, 'symbol')}
            {props.renderField(t('smartAlert.fields.comparisons'), (
                <div className="space-y-3 w-full">
                    {conditions.map((condition: any, index: number) => (
                        <div key={index} className="flex flex-row gap-2 w-full items-center">
                            <Select
                                value={condition.left}
                                onValueChange={(val) => updateCondition(index, 'left', val)}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder={t('smartAlert.fields.select')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {props.ema?.fields
                                        .find(f => f.name === 'comparisons')
                                        ?.values.map((value: string) => (
                                            <SelectItem key={value} value={value}>
                                                {value}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            <Select
                                value={condition.operator}
                                onValueChange={(val) => updateCondition(index, 'operator', val)}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder={t('smartAlert.fields.operator')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=">"> &gt; </SelectItem>
                                    <SelectItem value=">="> &gt;= </SelectItem>
                                    <SelectItem value="="> = </SelectItem>
                                    <SelectItem value="<"> &lt; </SelectItem>
                                    <SelectItem value="<="> &lt;= </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={condition.right}
                                onValueChange={(val) => updateCondition(index, 'right', val)}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder={t('smartAlert.fields.select')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {props.ema?.fields
                                        .find(f => f.name === 'comparisons')
                                        ?.values.map((value: string) => (
                                            <SelectItem key={value} value={value}>
                                                {value}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => removeCondition(index)}
                                disabled={conditions.length === 1}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={addCondition}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('smartAlert.fields.addCondition')}
                    </Button>
                </div>
            ), true, 'comparisons')}
        </div>
    );
}

export default ExponentialMovingAverage