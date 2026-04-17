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

function computeUnpaidForMonth(tenants, monthKey) {
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
  return { unpaid, totalExpected, totalCollected }
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

module.exports = {
  pad2,
  formatINR,
  istDateParts,
  formatMonthLong,
  getRentForMonth,
  isLiableForMonth,
  computeUnpaidForMonth,
  buildMessage,
  sendTelegram,
}
