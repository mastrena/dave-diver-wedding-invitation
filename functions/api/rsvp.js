import { randomToken, safeEqual, sha256 } from '../_lib/crypto.js'
import { json, readJson } from '../_lib/http.js'

const upstream = 'https://wedding.lmf.ac.cn/api/rsvp'
const submissionWindow = 15 * 60 * 1000
const blockedFor = 30 * 60 * 1000
const maxSubmissions = 10

function text(value, maxLength) { return String(value || '').trim().slice(0, maxLength) }
function dateTime(value) { const result = text(value, 16); return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(result) ? result : '' }
function hasDatabase(env) { return Boolean(env?.DB && typeof env.DB.prepare === 'function') }

function validate(body) {
  const guestName = text(body.guestName, 30)
  const partySize = Number(body.partySize)
  const needsAccommodation = body.needsAccommodation
  const checkInAt = dateTime(body.checkInAt)
  const checkOutAt = dateTime(body.checkOutAt)
  if (!guestName) throw new Error('请填写宾客姓名。')
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 6) throw new Error('出席人数不正确。')
  if (typeof needsAccommodation !== 'boolean') throw new Error('请选择是否需要住宿。')
  if (needsAccommodation && (!checkInAt || !checkOutAt)) throw new Error('请填写完整的住宿时间。')
  if (needsAccommodation && checkOutAt <= checkInAt) throw new Error('退房时间必须晚于入住时间。')
  return { guestName, partySize, needsAccommodation, checkInAt: needsAccommodation ? checkInAt : null, checkOutAt: needsAccommodation ? checkOutAt : null, phone: text(body.phone, 20), message: text(body.message, 200) }
}

async function proxy(request) {
  if (!['GET', 'POST'].includes(request.method)) return json({ error: '不支持的请求方式。' }, { status: 405 })
  try {
    const target = new URL(upstream)
    if (request.method === 'GET') target.search = new URL(request.url).search
    const response = await fetch(target, { method: request.method, headers: { 'Content-Type': request.headers.get('Content-Type') || 'application/json' }, body: request.method === 'POST' ? await request.text() : undefined })
    return new Response(response.body, { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
  } catch { return json({ error: '宾客登记服务暂时不可用，请稍后再试。' }, { status: 502 }) }
}

async function checkRateLimit(db, ip) {
  const now = Date.now()
  const record = await db.prepare('SELECT submissions, first_submitted_at, blocked_until FROM rsvp_submissions WHERE ip = ?').bind(ip).first()
  if (Number(record?.blocked_until || 0) > now) throw new Error('提交过于频繁，请稍后再试。')
  const withinWindow = record && now - Number(record.first_submitted_at) < submissionWindow
  const submissions = withinWindow ? Number(record.submissions) + 1 : 1
  await db.prepare('INSERT INTO rsvp_submissions (ip, submissions, first_submitted_at, blocked_until) VALUES (?, ?, ?, ?) ON CONFLICT(ip) DO UPDATE SET submissions = excluded.submissions, first_submitted_at = excluded.first_submitted_at, blocked_until = excluded.blocked_until').bind(ip, submissions, withinWindow ? record.first_submitted_at : now, submissions >= maxSubmissions ? now + blockedFor : 0).run()
}

export async function onRequestPost({ request, env }) {
  if (!hasDatabase(env)) return proxy(request)
  let body; let rsvp
  try { body = await readJson(request); rsvp = validate(body); await checkRateLimit(env.DB, request.headers.get('CF-Connecting-IP') || 'unknown') } catch (error) { return json({ error: error.message || '填写的信息不正确。' }, { status: 400 }) }
  const now = new Date().toISOString()
  if (body.id || body.editToken) {
    if (!body.id || !body.editToken) return json({ error: '缺少修改凭证。' }, { status: 401 })
    const existing = await env.DB.prepare('SELECT edit_token_hash FROM rsvps WHERE id = ?').bind(text(body.id, 80)).first()
    if (!existing || !safeEqual(existing.edit_token_hash, await sha256(body.editToken))) return json({ error: '修改凭证无效，请联系新人协助处理。' }, { status: 403 })
    await env.DB.prepare('UPDATE rsvps SET guest_name = ?, party_size = ?, needs_accommodation = ?, check_in_at = ?, check_out_at = ?, phone = ?, message = ?, updated_at = ? WHERE id = ?').bind(rsvp.guestName, rsvp.partySize, Number(rsvp.needsAccommodation), rsvp.checkInAt, rsvp.checkOutAt, rsvp.phone, rsvp.message, now, body.id).run()
    return json({ id: body.id, updatedAt: now })
  }
  const id = crypto.randomUUID(); const editToken = randomToken()
  await env.DB.prepare('INSERT INTO rsvps (id, guest_name, party_size, needs_accommodation, check_in_at, check_out_at, phone, message, edit_token_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, rsvp.guestName, rsvp.partySize, Number(rsvp.needsAccommodation), rsvp.checkInAt, rsvp.checkOutAt, rsvp.phone, rsvp.message, await sha256(editToken), now, now).run()
  return json({ id, editToken, createdAt: now }, { status: 201 })
}

export async function onRequestGet({ request, env }) {
  if (!hasDatabase(env)) return proxy(request)
  const url = new URL(request.url); const id = text(url.searchParams.get('id'), 80); const token = url.searchParams.get('token') || ''
  if (!id || !token) return json({ error: '缺少查询凭证。' }, { status: 401 })
  const row = await env.DB.prepare('SELECT id, guest_name AS guestName, party_size AS partySize, needs_accommodation AS needsAccommodation, check_in_at AS checkInAt, check_out_at AS checkOutAt, phone, message, edit_token_hash AS editTokenHash FROM rsvps WHERE id = ?').bind(id).first()
  if (!row || !safeEqual(row.editTokenHash, await sha256(token))) return json({ error: '查询凭证无效。' }, { status: 403 })
  delete row.editTokenHash; row.needsAccommodation = Boolean(row.needsAccommodation)
  return json(row)
}
