import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationTargetService, type NotificationTarget, type TelegramLink } from '@/services/notificationTargetService';

const Notification = (props: { renderField: any; config: any; handleChange: any; }) => {
    const { t } = useTranslation();
    const [targets, setTargets] = useState<NotificationTarget[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(true);
    const [targetError, setTargetError] = useState(false);
    const [telegramLink, setTelegramLink] = useState<TelegramLink | null>(null);
    const [creatingLink, setCreatingLink] = useState(false);
    const [linkError, setLinkError] = useState(false);
    const [copied, setCopied] = useState(false);

    const applyTargets = (items: NotificationTarget[]) => {
        const telegramTargets = items.filter(item => item.channel === 'telegram');
        setTargets(telegramTargets);
        setTargetError(false);
        if (telegramTargets.length > 0 && !telegramTargets.some(item => item.address === props.config.target)) {
            props.handleChange('target', telegramTargets[0].address);
        }
        return telegramTargets;
    };

    const loadTargets = () => notificationTargetService.list().then(applyTargets);

    useEffect(() => {
        let active = true;
        notificationTargetService.list()
            .then((items) => {
                if (!active) return;
                applyTargets(items);
            })
            .catch(() => { if (active) setTargetError(true); })
            .finally(() => { if (active) setLoadingTargets(false); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!telegramLink) return;
        const timer = window.setInterval(() => {
            notificationTargetService.telegramLinkStatus(telegramLink.sessionId)
                .then(status => {
                    if (status.status !== 'verified') return;
                    return loadTargets().then(items => {
                        if (items.length > 0) setTelegramLink(null);
                    });
                })
                .catch(() => undefined);
        }, 3000);
        return () => window.clearInterval(timer);
    }, [telegramLink]);

    const createTelegramLink = async () => {
        setCreatingLink(true);
        setLinkError(false);
        try {
            setTelegramLink(await notificationTargetService.createTelegramLink());
        } catch {
            setLinkError(true);
        } finally {
            setCreatingLink(false);
        }
    };

    const copyCommand = async () => {
        if (!telegramLink) return;
        await navigator.clipboard.writeText(`/start ${telegramLink.code}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };
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
                        <SelectItem value="discord" disabled>{t('smartAlert.fields.discord')}</SelectItem>
                        <SelectItem value="email" disabled>{t('smartAlert.fields.email')}</SelectItem>
                    </SelectContent>
                </Select>
            ))}
            {props.renderField(t('smartAlert.fields.telegramDestination'), (
                loadingTargets ? (
                    <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t('common.loading')}</div>
                ) : targets.length > 0 ? (
                    <div className="space-y-3">
                        <Select value={props.config.target || ''} onValueChange={(value) => props.handleChange('target', value)}>
                            <SelectTrigger><SelectValue placeholder={t('smartAlert.fields.selectTelegramDestination')} /></SelectTrigger>
                            <SelectContent>{targets.map(target => <SelectItem key={target.id} value={target.address}>{target.label}</SelectItem>)}</SelectContent>
                        </Select>
                        {telegramLink ? (
                            <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                                <p>{t('smartAlert.fields.telegramConnectInstruction')}</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-background px-2 py-2 font-mono text-foreground">/start {telegramLink.code}</code>
                                    <Button type="button" size="icon" variant="outline" onClick={copyCommand} aria-label={t('smartAlert.fields.copyTelegramCommand')}>
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button type="button" size="sm" asChild>
                                    <a href={telegramLink.deepLink} target="_blank" rel="noreferrer">{t('smartAlert.fields.openTelegramBot')}</a>
                                </Button>
                                <p>{t('smartAlert.fields.telegramWaiting')}</p>
                            </div>
                        ) : (
                            <Button type="button" size="sm" variant="outline" onClick={createTelegramLink} disabled={creatingLink}>
                                {creatingLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('smartAlert.fields.refreshTelegramLink')}
                            </Button>
                        )}
                        {linkError && <p className="text-xs text-destructive">{t('smartAlert.fields.telegramLinkError')}</p>}
                    </div>
                ) : (
                    <div className="space-y-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                        <div className="flex gap-2">
                            <TriangleAlert className="h-4 w-4 shrink-0" />
                            <span>{targetError ? t('smartAlert.fields.telegramTargetsError') : t('smartAlert.fields.telegramNotLinked')}</span>
                        </div>
                        {telegramLink ? (
                            <div className="space-y-2">
                                <p>{t('smartAlert.fields.telegramConnectInstruction')}</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-background px-2 py-2 font-mono text-foreground">/start {telegramLink.code}</code>
                                    <Button type="button" size="icon" variant="outline" onClick={copyCommand} aria-label={t('smartAlert.fields.copyTelegramCommand')}>
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button type="button" size="sm" asChild>
                                    <a href={telegramLink.deepLink} target="_blank" rel="noreferrer">{t('smartAlert.fields.openTelegramBot')}</a>
                                </Button>
                                <p>{t('smartAlert.fields.telegramWaiting')}</p>
                            </div>
                        ) : (
                            <Button type="button" size="sm" variant="outline" onClick={createTelegramLink} disabled={creatingLink}>
                                {creatingLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('smartAlert.fields.connectTelegram')}
                            </Button>
                        )}
                        {linkError && <p>{t('smartAlert.fields.telegramLinkError')}</p>}
                    </div>
                )
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
