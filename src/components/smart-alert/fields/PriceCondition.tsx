import { useEffect } from 'react';
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select.tsx";
import type { Definition } from "@/services/mosaicService.ts";
import { useTranslation } from 'react-i18next';

const PriceCondition = (props: { renderField: any; config: any; handleChange: any; priceCondition: Definition | undefined; errors: any }) => {
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
            {props.renderField(t('smartAlert.fields.operatorAndPrice'), (
                <div className="flex flex-row gap-2 w-full items-center">
                    <Select
                        value={props.config.operator || ''}
                        onValueChange={(val) => props.handleChange('operator', val)}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder={t('smartAlert.fields.selectOperator')} />
                        </SelectTrigger>
                        <SelectContent>
                            {props.priceCondition?.fields
                                .find(f => f.name === 'operator')
                                ?.values.map((value: string) => (
                                    <SelectItem key={value} value={value}>
                                        {value}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                    <div className="relative group flex-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">$</span>
                        <Input
                            type="number"
                            className="pl-7 font-mono transition-all focus:scale-[1.01] w-full"
                            value={props.config.price || ''}
                            aria-invalid={!!props.errors.price}
                            step="0.000001"
                            min="0"
                            onChange={(e) => handleNumericChange('price', e.target.value)}
                            placeholder="50000"
                        />
                    </div>
                </div>
            ), true, 'price')}

        </div>
    );
}

export default PriceCondition;