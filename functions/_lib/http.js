export function json(data, init = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export async function readJson(request) {
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) throw new Error('请求格式不正确。')
  return request.json()
}
