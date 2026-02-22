import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import type { Definition } from "@/services/mosaicService.ts";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const BollingerBands = (props: { renderField: any; config: any; handleChange: any; bollingerBands: Definition | undefined; errors: any }) => {
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

    const handleNumericChange = (key: string, value: string) => {
        let val = value;
        if (val.includes('.')) {
            const [int, dec] = val.split('.');
            if (dec.length > 6) {
                val = `${int}.${dec.substring(0, 6)}`;
            }
        }
        props.handleChange(key, val === '' ? '' : parseFloat(val));
    };

    return (
        <div className="space-y-4">
            {props.renderField('Symbol', (
                <Input
                    type="text"
                    value={props.config.symbol || ''}
                    onChange={(e) => props.handleChange('symbol', e.target.value)}
                    placeholder="BTC"
                    aria-invalid={!!props.errors.symbol}
                    className="font-mono uppercase transition-all focus:scale-[1.01]"
                />
            ), true, 'symbol')}
            {props.renderField('Comparisons', (
                <div className="space-y-3 w-full">
                    {conditions.map((condition: any, index: number) => (
                        <div key={index} className="flex flex-row gap-2 w-full items-center">
                            <Select
                                value={condition.left}
                                onValueChange={(val) => updateCondition(index, 'left', val)}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {props.bollingerBands?.fields
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
                                    <SelectValue placeholder="Operator" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem key=">" value=">"> &gt; </SelectItem>
                                    <SelectItem key=">=" value=">="> &gt;= </SelectItem>
                                    <SelectItem key="=" value="="> = </SelectItem>
                                    <SelectItem key="<" value="<"> &lt; </SelectItem>
                                    <SelectItem key="<=" value="<="> &lt;= </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={condition.right}
                                onValueChange={(val) => updateCondition(index, 'right', val)}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {props.bollingerBands?.fields
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
                        Add Condition
                    </Button>
                </div>
            ), false, 'comparisons')}
            {props.renderField('Bandwidth', (
                <div className="flex flex-row gap-2 w-full items-center">
                    <Select
                        value={props.config.bandwidth_operator || '>'}
                        onValueChange={(val) => props.handleChange('bandwidth_operator', val)}
                    >
                        <SelectTrigger className="w-[90px] shrink-0 flex-1">
                            <SelectValue placeholder="Op" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=">"> &gt; </SelectItem>
                            <SelectItem value=">="> &gt;= </SelectItem>
                            <SelectItem value="<"> &lt; </SelectItem>
                            <SelectItem value="<="> &lt;= </SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative group flex-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">%</span>
                        <Input
                            type="number"
                            value={props.config.bandwidth || ''}
                            onChange={(e) => handleNumericChange('bandwidth', e.target.value)}
                            aria-invalid={!!props.errors.bandwidth}
                            step="0.000001"
                            min="0"
                            className="pl-7 font-mono transition-all focus:scale-[1.01] w-full"
                        />
                    </div>
                </div>
            ), false, 'bandwidth')}
        </div >
    );
}

export default BollingerBands