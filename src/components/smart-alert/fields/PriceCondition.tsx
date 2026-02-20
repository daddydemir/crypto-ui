/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import type { Definition } from "@/services/mosaicService.ts";


const PriceCondition = (props: { renderField: any; config: any; handleChange: any; priceCondition: Definition | undefined }) => {
    return (
        <div className="space-y-4">
            {props.renderField('Symbol', (
                <Input
                    type="text"
                    value={props.config.symbol || ''}
                    onChange={(e) => props.handleChange('symbol', e.target.value)}
                    placeholder="BTC"
                    className="font-mono uppercase transition-all focus:scale-[1.01]"
                />
            ))}
            {props.renderField('Operator', (
                <div className="flex flex-row gap-2 w-full items-center">
                    <Select
                        value={props.config.operator || '>'}
                        onValueChange={(val) => props.handleChange('operator', val)}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select operator" />
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
                            onChange={(e) => props.handleChange('price', parseFloat(e.target.value))}
                            placeholder="50000"
                        />
                    </div>
                </div>
            ))}

        </div>
    );
}

export default PriceCondition;