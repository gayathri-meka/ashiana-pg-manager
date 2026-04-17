const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const logger = require('firebase-functions/logger')

initializeApp()
const db = getFirestore()

const TELEGRAM_BOT_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN')

function pad2(n) { return String(n).padStart(2, '0') }

function formatINR(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN')
}

function istDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find(p => p.type === 'year').value)
  const month = Number(parts.find(p => p.type === 'month').value)
  const day = Number(parts.find(p => p.type === 'day').value)
  const monthKey = `${year}-${pad2(month)}`
  const dateKey = `${monthKey}-${pad2(day)}`
  const lastDay = new Date(year, month, 0).getDate()
  return { year, month, day, monthKey, dateKey, lastDay }
}

function formatMonthLong(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  })
}

function getRentForMonth(tenant, month) {
  const changes = tenant.rentChanges
  if (!changes || changes.length === 0) return tenant.rent || 0
  let amount = tenant.rent || 0
  for (const rc of changes) {
    if (rc.from <= month) amount = rc.amount
  }
  return amount
}

function isLiableForMonth(tenant, monthKey) {
  const joiningMonth = (tenant.joiningDate || '').slice(0, 7)
  if (!joiningMonth || joiningMonth > monthKey) return false
  if (tenant.active) return true
  const vacateMonth = (tenant.vacateDate || '').slice(0, 7)
  return vacateMonth && vacateMonth >= monthKey
}

async function sendTelegram(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Telegram ${res.status}: ${body}`)
  }
}

function buildMessage({ monthLabel, unpaid, totalExpected, totalCollected }) {
  if (unpaid.length === 0) {
    return [
      `Ashiana Rent Reminder — ${monthLabel}`,
      '',
      'All tenants paid this month. ✅',
      '',
      `Collected: ${formatINR(totalCollected)} / ${formatINR(totalExpected)}`,
    ].join('\n')
  }
  const lines = unpaid.map(u => `- Room ${u.roomId} — ${u.name} — ${formatINR(u.amount)}`)
  return [
    `Ashiana Rent Reminder — ${monthLabel}`,
    '',
    `Pending payments (${unpaid.length}):`,
    ...lines,
    '',
    `Collected: ${formatINR(totalCollected)} / ${formatINR(totalExpected)}`,
  ].join('\n')
}

exports.notifyUnpaidRent = onSchedule(
  {
    schedule: '0 7 * * *',
    timeZone: 'Asia/Kolkata',
    secrets: [TELEGRAM_BOT_TOKEN],
    region: 'asia-south1',
  },
  async () => {
    const { year, month, day, monthKey, dateKey, lastDay } = istDateParts()

    // Only run on the last 3 days of the month
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

    let totalExpected = 0
    let totalCollected = 0
    const unpaid = []

    for (const t of tenants) {
      if (!isLiableForMonth(t, monthKey)) continue
      const due = getRentForMonth(t, monthKey)
      totalExpected += due
      const paid = !!(t.rentHistory || {})[monthKey]
      if (paid) {
        totalCollected += due
      } else {
        unpaid.push({ name: t.name, roomId: t.roomId, amount: due })
      }
    }

    unpaid.sort((a, b) => String(a.roomId).localeCompare(String(b.roomId), 'en'))

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
