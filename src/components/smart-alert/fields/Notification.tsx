import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Input} from "@/components/ui/input.tsx";

const Notification = (props: { renderField: any; config: any; handleChange: any;  }) => {
    return (
        <div className="space-y-4">
            {props.renderField('Channel', (
                <Select
                    value={props.config.channel || 'telegram'}
                    onValueChange={(val) => props.handleChange('channel', val)}
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
            {props.renderField('Target User/Group', (
                <Input
                    type="text"
                    value={props.config.target || ''}
                    onChange={(e) => props.handleChange('target', e.target.value)}
                    placeholder="@username or email"
                    className="transition-all focus:scale-[1.01]"
                />
            ))}
            {props.renderField('Message', (
                <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all focus:scale-[1.01]"
                    value={props.config.message || ''}
                    onChange={(e) => props.handleChange('message', e.target.value)}
                    placeholder="Alert message..."
                />
            ))}
        </div>
    );
}

export default Notification;