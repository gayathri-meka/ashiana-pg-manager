const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const logger = require('firebase-functions/logger')

const {
  istDateParts,
  formatMonthLong,
  computeUnpaidForMonth,
  buildMessage,
  sendTelegram,
} = require('./lib')

initializeApp()
const db = getFirestore()

const TELEGRAM_BOT_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN')
const TELEGRAM_WEBHOOK_SECRET = defineSecret('TELEGRAM_WEBHOOK_SECRET')

exports.notifyUnpaidRent = onSchedule(
  {
    schedule: '0 7 * * *',
    timeZone: 'Asia/Kolkata',
    secrets: [TELEGRAM_BOT_TOKEN],
    region: 'asia-south1',
  },
  async () => {
    const { year, month, day, monthKey, dateKey, lastDay } = istDateParts()

    if (day < lastDay - 2) {
      logger.info(`Skip: day ${day} is not in last 3 days (lastDay=${lastDay})`)
      return
    }

    const notifRef = db.doc(`notifications/${monthKey}`)
    const notifSnap = await notifRef.get()
    const notif = notifSnap.exists ? notifSnap.data() : {}

    if (notif.completedAt) {
      logger.info(`Skip: ${monthKey} already completed`)
      return
    }
    if (notif.lastSentOn === dateKey) {
      logger.info(`Skip: already sent on ${dateKey}`)
      return
    }

    const pgSnap = await db.doc('pgData/main').get()
    if (!pgSnap.exists) {
      logger.warn('Skip: pgData/main missing')
      return
    }
    const { tenants = [] } = pgSnap.data()

    const { unpaid, totalExpected, totalCollected } = computeUnpaidForMonth(tenants, monthKey)

    const adminsSnap = await db.collection('admins').get()
    const chatIds = adminsSnap.docs
      .map(d => d.data().telegramChatId)
      .filter(id => id && String(id).trim())
      .map(id => String(id).trim())

    if (chatIds.length === 0) {
      logger.warn('No admins with telegramChatId configured; nothing to send')
      return
    }

    const monthLabel = formatMonthLong(year, month)
    const text = buildMessage({ monthLabel, unpaid, totalExpected, totalCollected })

    const token = TELEGRAM_BOT_TOKEN.value()
    const results = await Promise.allSettled(
      chatIds.map(chatId => sendTelegram(token, chatId, text))
    )
    const failed = results.filter(r => r.status === 'rejected')
    for (const f of failed) logger.error('Telegram send failed', f.reason)

    const update = {
      lastSentOn: dateKey,
      sentDays: FieldValue.arrayUnion(dateKey),
      lastSuccessCount: results.length - failed.length,
      lastFailureCount: failed.length,
    }
    if (unpaid.length === 0) {
      update.completedAt = FieldValue.serverTimestamp()
    }
    await notifRef.set(update, { merge: true })

    logger.info(
      `Sent to ${results.length - failed.length}/${chatIds.length} admins. ` +
      `Unpaid=${unpaid.length}. Completed=${unpaid.length === 0}`
    )
  }
)

exports.telegramWebhook = onRequest(
  {
    region: 'asia-south1',
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET],
    cors: false,
    invoker: 'public',
  },
  async (req, res) => {
    // Verify Telegram's secret token header
    const expected = TELEGRAM_WEBHOOK_SECRET.value()
    const received = req.get('X-Telegram-Bot-Api-Secret-Token')
    if (!expected || received !== expected) {
      logger.warn('Webhook called without valid secret token')
      res.status(401).send('unauthorized')
      return
    }

    const update = req.body || {}
    const msg = update.message || update.edited_message
    const chatId = msg?.chat?.id
    const rawText = msg?.text

    if (!chatId || !rawText) {
      res.status(200).send('ok')
      return
    }

    const chatIdStr = String(chatId)
    // Strip @botname suffix that appears in group chats: "/pending@ashiana_bot"
    const text = rawText.split('@')[0].trim().toLowerCase()
    const token = TELEGRAM_BOT_TOKEN.value()

    try {
      const adminsSnap = await db
        .collection('admins')
        .where('telegramChatId', '==', chatIdStr)
        .get()
      const isAuthorized = !adminsSnap.empty

      if (text === '/start') {
        const greeting = isAuthorized
          ? [
              '👋 Welcome to Ashiana Rent Reminder.',
              '',
              'Available commands:',
              '/pending — unpaid tenants for this month',
            ].join('\n')
          : [
              '👋 This bot sends rent reminders to Ashiana admins.',
              '',
              `Your Telegram chat ID is ${chatIdStr}. Ask an admin to link it in the app's Settings → Admins.`,
            ].join('\n')
        await sendTelegram(token, chatIdStr, greeting)
      } else if (text === '/pending') {
        if (!isAuthorized) {
          await sendTelegram(token, chatIdStr, 'Not authorized.')
        } else {
          const pgSnap = await db.doc('pgData/main').get()
          const tenants = pgSnap.exists ? (pgSnap.data().tenants || []) : []
          const { monthKey, year, month } = istDateParts()
          const result = computeUnpaidForMonth(tenants, monthKey)
          const body = buildMessage({
            monthLabel: formatMonthLong(year, month),
            ...result,
          })
          await sendTelegram(token, chatIdStr, body)
        }
      } else if (isAuthorized) {
        await sendTelegram(token, chatIdStr, 'Unknown command. Try /pending')
      }
      // Unauthorized users sending non-/start commands: ignore silently
    } catch (err) {
      logger.error('Webhook handler failed', err)
    }

    res.status(200).send('ok')
  }
)
