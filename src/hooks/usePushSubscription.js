import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { urlBase64ToUint8Array } from '../lib/vapid'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Whether this browser can receive push notifications at all — false in
// e.g. private/incognito Safari, or when VITE_VAPID_PUBLIC_KEY isn't set.
export function isPushSupported() {
  return (
    Boolean(VAPID_PUBLIC_KEY) &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// Manages this browser's push subscription: whether one exists, and
// subscribe()/unsubscribe() to create or remove it (both locally, via the
// PushManager, and in Supabase's `push_subscriptions` table, which is what
// the send-lesson-reminders edge function reads from). Independent of
// notification_settings — a browser can be subscribed while reminders are
// paused, so re-enabling doesn't require asking for permission again.
export function usePushSubscription(userId) {
  const [subscription, setSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId || !isPushSupported()) {
      setSubscription(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => {
        if (!cancelled) setSubscription(existing)
      })
      .catch((err) => console.error('Failed to read push subscription', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  async function subscribe() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const json = sub.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: 'endpoint' },
    )
    if (error) {
      console.error('Failed to save push subscription', error)
      await sub.unsubscribe()
      throw error
    }

    setSubscription(sub)
    return sub
  }

  async function unsubscribe() {
    if (!subscription) return
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    setSubscription(null)
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    if (error) console.error('Failed to remove push subscription', error)
  }

  return { subscription, isSubscribed: Boolean(subscription), isLoading, subscribe, unsubscribe }
}
