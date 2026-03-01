import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useTranslation } from 'react-i18next';

const Notification = (props: { renderField: any; config: any; handleChange: any; }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-4">
            {props.renderField(t('smartAlert.fields.channel'), (
                <Select
                    value={props.config.channel || 'telegram'}
                    onValueChange={(val) => props.handleChange('channel', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('smartAlert.fields.channel')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="telegram">{t('smartAlert.fields.telegram')}</SelectItem>
                        <SelectItem value="discord">{t('smartAlert.fields.discord')}</SelectItem>
                        <SelectItem value="email">{t('smartAlert.fields.email')}</SelectItem>
                    </SelectContent>
                </Select>
            ))}
            {props.renderField(t('smartAlert.fields.targetUserGroup'), (
                <Input
                    type="text"
                    value={props.config.target || ''}
                    onChange={(e) => props.handleChange('target', e.target.value)}
                    placeholder={t('smartAlert.fields.targetPlaceholder')}
                    className="transition-all focus:scale-[1.01]"
                />
            ))}
            {props.renderField(t('smartAlert.fields.message'), (
                <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all focus:scale-[1.01]"
                    value={props.config.message || ''}
                    onChange={(e) => props.handleChange('message', e.target.value)}
                    placeholder={t('smartAlert.fields.messagePlaceholder')}
                />
            ))}
        </div>
    );
}

export default Notification;