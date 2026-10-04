import type { CryptoNotification } from './notificationService'

const enabledKey = 'browserNotificationsEnabled'
const seenKey = 'lastBrowserNotificationTime'

export const browserNotificationsSupported = () => 'Notification' in window
export const browserNotificationsEnabled = () => localStorage.getItem(enabledKey) === 'true' && Notification.permission === 'granted'

export async function setBrowserNotificationsEnabled(enabled: boolean): Promise<boolean> {
  if (!browserNotificationsSupported()) return false
  if (!enabled) {
    localStorage.setItem(enabledKey, 'false')
    return false
  }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  const accepted = permission === 'granted'
  localStorage.setItem(enabledKey, String(accepted))
  if (accepted && !localStorage.getItem(seenKey)) localStorage.setItem(seenKey, String(Math.floor(Date.now() / 1000)))
  return accepted
}

export async function notifyNewBrowserNotifications(items: CryptoNotification[]) {
  if (!browserNotificationsEnabled() || items.length === 0) return
  const previous = Number(localStorage.getItem(seenKey) || 0)
  const unseen = items.filter(item => item.CreateTime > previous).sort((a, b) => a.CreateTime - b.CreateTime)
  if (unseen.length === 0) return
  const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready.catch(() => null) : null
  for (const item of unseen) {
    const title = item.Type === 'PRICE_ALERT' ? 'CoinScope · Price Alert' : 'CoinScope'
    const options: NotificationOptions = { body: item.Coin, icon: '/coinscope-icon-192.png?v=20261004', badge: '/coinscope-icon-192.png?v=20261004', tag: `${item.Type}-${item.CreateTime}`, data: { url: item.Type === 'PRICE_ALERT' ? '/alarms' : '/' } }
    if (registration) await registration.showNotification(title, options)
    else new Notification(title, options)
  }
  localStorage.setItem(seenKey, String(Math.max(...unseen.map(item => item.CreateTime))))
}
