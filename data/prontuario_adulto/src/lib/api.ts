import { PUBLIC_API_URL } from '$env/static/public'

// Chama o FastAPI com o JWT da sessão atual
export async function apiFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PUBLIC_API_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }))
    const detail = error.detail ?? `HTTP ${response.status}`
    // If detail is an object (e.g. 409 conflict), serialize it for downstream parsing
    const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail
    const err: any = new Error(msg)
    err.status = response.status
    throw err
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}
