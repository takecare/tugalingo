// Lesson-reminder push notifications. Registered from src/main.jsx at
// import.meta.env.BASE_URL + 'sw.js' so its scope covers the app under
// vite.config.js's `base: '/tugalingo/'`. See docs/architecture.md#lesson-reminders.

self.addEventListener('push', (event) => {
  let payload = { title: 'tugalingo', body: 'Time for a lesson!' }
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() }
    } catch {
      payload.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: `${self.registration.scope}favicon.svg`,
      tag: 'lesson-reminder', // a new reminder replaces an unread one instead of stacking
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const appUrl = self.registration.scope

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = clientsList.find((client) => client.url.startsWith(appUrl))
      if (existing) {
        await existing.focus()
      } else {
        await self.clients.openWindow(appUrl)
      }
    })(),
  )
})
