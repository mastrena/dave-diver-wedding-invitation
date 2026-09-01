import { clearSessionCookie } from '../../_lib/auth.js'
import { json } from '../../_lib/http.js'

export function onRequestPost() { return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } }) }
