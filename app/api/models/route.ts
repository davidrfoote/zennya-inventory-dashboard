import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BASE = process.env.INVENTORY_API_BASE || 'https://api-inventory.zennya.com'
const TOKEN = process.env.INVENTORY_API_TOKEN || ''

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = parseInt(searchParams.get('limit') || '50')
  const q = searchParams.get('q') || ''

  try {
    const res = await fetch(
      `${BASE}/1/integrations/search/models?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`,
      { headers: { 'X-Auth-Token': TOKEN }, cache: 'no-store' }
    )
    if (!res.ok) return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
