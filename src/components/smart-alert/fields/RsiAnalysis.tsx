import { Input } from "@/components/ui/input.tsx";
import type { Definition } from "@/services/mosaicService.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

const RsiAnalysis = (props: { renderField: any; config: any; handleChange: any; rsiAnalysis: Definition | undefined }) => {
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
            {props.renderField('Index', (

                <div className="flex flex-row gap-2 w-full items-center">
                    <Select
                        value={props.config.operator || '>'}
                        onValueChange={(val) => props.handleChange('operator', val)}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select operator" />
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
                        onChange={(e) => props.handleChange('period', parseInt(e.target.value))}
                        placeholder="14"
                        className="font-mono transition-all focus:scale-[1.01] flex-3"
                    />
                </div>
            ))}
        </div>
    );
}

export default RsiAnalysis