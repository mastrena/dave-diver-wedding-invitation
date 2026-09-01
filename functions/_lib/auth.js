import { base64UrlToBytes, bytesToBase64Url, safeEqual } from './crypto.js'

const encoder = new TextEncoder()
const cookieName = 'blue_hole_wedding_admin_session'
const lifetimeSeconds = 8 * 60 * 60

async function signature(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return bytesToBase64Url(new Uint8Array(bytes))
}

export async function createSessionCookie(secret) {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + lifetimeSeconds })))
  return `${cookieName}=${payload}.${await signature(payload, secret)}; Path=/; Max-Age=${lifetimeSeconds}; HttpOnly; Secure; SameSite=Strict`
}

export function clearSessionCookie() {
  return `${cookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
}

export async function isAdmin(request, secret) {
  if (!secret) return false
  const token = (request.headers.get('Cookie') || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  if (!token) return false
  const [payload, received] = token.split('.')
  if (!payload || !received || !safeEqual(received, await signature(payload, secret))) return false
  try { return Number(JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))).exp) > Math.floor(Date.now() / 1000) } catch { return false }
}
