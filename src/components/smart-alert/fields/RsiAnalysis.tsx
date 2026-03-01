import { useEffect } from 'react';
import { Input } from "@/components/ui/input.tsx";
import type { Definition } from "@/services/mosaicService.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useTranslation } from 'react-i18next';

const RsiAnalysis = (props: { renderField: any; config: any; handleChange: any; rsiAnalysis: Definition | undefined; errors: any }) => {
    const { t } = useTranslation();
    // Initial default for operator
    useEffect(() => {
        if (!props.config.operator) {
            props.handleChange('operator', '>');
        }
    }, []);

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
            {props.renderField(t('smartAlert.fields.operatorAndIndex'), (

                <div className="flex flex-row gap-2 w-full items-center">
                    <Select
                        value={props.config.operator || ''}
                        onValueChange={(val) => props.handleChange('operator', val)}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder={t('smartAlert.fields.selectOperator')} />
                        </SelectTrigger>
                        <SelectContent>
                            {props.rsiAnalysis?.fields
                                .find(f => f.name === 'operator')
                                ?.values.map((value: string) => (
                                    <SelectItem key={value} value={value}>
                                        {value}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>

                    <Input
                        type="number"
                        min={1} max={99}
                        value={props.config.index || ''}
                        aria-invalid={!!props.errors.index}
                        onChange={(e) => handleNumericChange('index', e.target.value)}
                        placeholder="14"
                        step="0.000001"
                        className="font-mono transition-all focus:scale-[1.01] flex-3"
                    />
                </div>
            ), true, 'index')}
        </div>
    );
}

export default RsiAnalysis