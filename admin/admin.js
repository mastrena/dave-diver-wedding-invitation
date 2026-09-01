const loginView = document.querySelector('#login-view')
const dashboardView = document.querySelector('#dashboard-view')
const loginForm = document.querySelector('#login-form')
const loginError = document.querySelector('#login-error')
const dashboardError = document.querySelector('#dashboard-error')
const guestList = document.querySelector('#guest-list')
const emptyState = document.querySelector('#empty-state')
const searchInput = document.querySelector('#search-input')
const accommodationFilter = document.querySelector('#accommodation-filter')
const resultLine = document.querySelector('#result-line')
const demoPill = document.querySelector('#demo-pill')

const demoRsvps = [
  { id: 'demo-1', guestName: '陈星', partySize: 2, needsAccommodation: true, checkInAt: '2026-10-31T15:00', checkOutAt: '2026-11-01T12:00', phone: '138****1024', message: '提前祝二位新婚快乐，蓝洞见！', createdAt: '2026-08-28T03:12:00.000Z', updatedAt: '2026-08-28T03:12:00.000Z' },
  { id: 'demo-2', guestName: '王小鱼', partySize: 1, needsAccommodation: false, checkInAt: null, checkOutAt: null, phone: '139****5278', message: '任务收到，一定准时抵达。', createdAt: '2026-08-29T06:18:00.000Z', updatedAt: '2026-08-29T06:18:00.000Z' },
  { id: 'demo-3', guestName: '李海洋', partySize: 3, needsAccommodation: true, checkInAt: '2026-10-31T14:00', checkOutAt: '2026-11-02T10:00', phone: '186****8831', message: '带上家人一起来参加这场特别委托！', createdAt: '2026-08-30T12:45:00.000Z', updatedAt: '2026-08-30T12:45:00.000Z' },
]

let rsvps = []
let isDemo = new URLSearchParams(location.search).get('demo') === '1'
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

function formatDate(value) {
  if (!value) return '未填写'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ')
  const parts = Object.fromEntries(dateFormatter.formatToParts(date).map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

function formatStay(value) { return value ? String(value).replace('T', ' ') : '未填写' }
function setMessage(element, message) { element.textContent = message; element.hidden = !message }
function showLogin() { dashboardView.hidden = true; loginView.hidden = false }
function showDashboard() { loginView.hidden = true; dashboardView.hidden = false; demoPill.hidden = !isDemo }
function appendText(parent, className, value) { const element = document.createElement('p'); if (className) element.className = className; element.textContent = value; parent.append(element) }
function field(label, content, className = '') { const box = document.createElement('div'); if (className) box.className = className; const title = document.createElement('span'); title.className = 'field-label'; title.textContent = label; box.append(title, content); return box }

function visibleRsvps() {
  const query = searchInput.value.trim().toLowerCase()
  return rsvps.filter((rsvp) => {
    const accommodationMatches = accommodationFilter.value === 'all' || (accommodationFilter.value === 'yes') === Boolean(rsvp.needsAccommodation)
    const queryMatches = !query || [rsvp.guestName, rsvp.phone, rsvp.message].some((value) => String(value || '').toLowerCase().includes(query))
    return accommodationMatches && queryMatches
  })
}

function renderStats() {
  document.querySelector('#stat-replies').textContent = String(rsvps.length)
  document.querySelector('#stat-guests').textContent = String(rsvps.reduce((total, rsvp) => total + Number(rsvp.partySize || 0), 0))
  document.querySelector('#stat-accommodation').textContent = String(rsvps.filter((rsvp) => Boolean(rsvp.needsAccommodation)).length)
}

function renderList() {
  const visible = visibleRsvps()
  guestList.replaceChildren()
  emptyState.hidden = visible.length > 0
  resultLine.textContent = `共 ${rsvps.length} 份登记 · 当前显示 ${visible.length} 份`
  visible.forEach((rsvp) => {
    const card = document.createElement('article')
    card.className = 'guest-card'
    const identity = document.createElement('div'); identity.className = 'identity'
    const name = document.createElement('h2'); name.textContent = rsvp.guestName || '未命名宾客'
    identity.append(name); appendText(identity, '', rsvp.phone || '未留联系电话')
    const badge = document.createElement('span'); badge.className = `badge${rsvp.needsAccommodation ? '' : ' no'}`; badge.textContent = rsvp.needsAccommodation ? '需要住宿' : '无需住宿'
    const party = document.createElement('p'); party.textContent = `${Number(rsvp.partySize || 0)} 人`
    const stay = document.createElement('p'); stay.textContent = rsvp.needsAccommodation ? `${formatStay(rsvp.checkInAt)}\n至 ${formatStay(rsvp.checkOutAt)}` : '本次不安排住宿'; stay.style.whiteSpace = 'pre-line'
    const message = document.createElement('p'); message.textContent = rsvp.message || '没有留下祝福语'
    const update = document.createElement('p'); update.className = 'updated'; update.textContent = `更新于\n${formatDate(rsvp.updatedAt)}`; update.style.whiteSpace = 'pre-line'
    card.append(identity, field('住宿需求', badge), field('赴约人数', party), field('住宿时间', stay, 'stay'), field('留言祝福', message, 'message'), update)
    guestList.append(card)
  })
}

async function api(url, init) {
  const response = await fetch(url, { ...init, headers: { Accept: 'application/json', ...(init?.headers || {}) } })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) { const error = new Error(result.error || '蓝洞数据站暂时无法响应。'); error.status = response.status; throw error }
  return result
}

async function loadRsvps() {
  setMessage(dashboardError, '')
  if (isDemo) { rsvps = structuredClone(demoRsvps); showDashboard(); renderStats(); renderList(); document.querySelector('#last-updated').textContent = '演示模式 · 这些都是虚拟宾客信息'; return }
  try {
    const result = await api('/api/admin/rsvps')
    rsvps = Array.isArray(result.rsvps) ? result.rsvps : []
    showDashboard(); renderStats(); renderList()
    document.querySelector('#last-updated').textContent = `已同步 · ${formatDate(new Date().toISOString())}`
  } catch (error) {
    if (error.status === 401) { showLogin(); return }
    showLogin(); setMessage(loginError, error.message)
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault(); setMessage(loginError, '')
  const button = loginForm.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = '正在验证潜水证…'
  try {
    await api('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: loginForm.elements.password.value }) })
    loginForm.reset(); await loadRsvps()
  } catch (error) { setMessage(loginError, error.message) }
  finally { button.disabled = false; button.innerHTML = '<span>🔑</span> 进入任务终端' }
})
document.querySelector('#demo-button').addEventListener('click', () => { isDemo = true; loadRsvps() })
document.querySelector('#logout-button').addEventListener('click', async () => { if (!isDemo) await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {}); rsvps = []; isDemo = false; showLogin() })
document.querySelector('#refresh-button').addEventListener('click', async () => { await loadRsvps() })
searchInput.addEventListener('input', renderList)
accommodationFilter.addEventListener('change', renderList)

document.querySelector('#export-button').addEventListener('click', async (event) => {
  const button = event.currentTarget
  button.disabled = true; button.textContent = '正在生成 Excel…'
  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
    const rows = rsvps.map((rsvp) => ({ '宾客姓名': rsvp.guestName, '赴约人数': Number(rsvp.partySize || 0), '是否需要住宿': rsvp.needsAccommodation ? '需要' : '无需', '入住时间': rsvp.needsAccommodation ? formatStay(rsvp.checkInAt) : '', '退房时间': rsvp.needsAccommodation ? formatStay(rsvp.checkOutAt) : '', '联系电话': rsvp.phone || '', '留言祝福': rsvp.message || '', '提交时间': formatDate(rsvp.createdAt), '最后更新': formatDate(rsvp.updatedAt) }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    sheet['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 34 }, { wch: 20 }, { wch: 20 }]
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, '宾客名单')
    XLSX.writeFile(book, `蓝洞婚礼宾客名单-${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (error) { setMessage(dashboardError, `Excel 导出失败：${error.message || '请检查网络后重试。'}`) }
  finally { button.disabled = false; button.textContent = '⇩ 导出 Excel' }
})

loadRsvps()
