import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BASE = process.env.INVENTORY_API_BASE || 'https://api-inventory.zennya.com'
const TOKEN = process.env.INVENTORY_API_TOKEN || ''

// POST body: { ids: number[] }
export async function POST(req: Request) {
  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json([])

  const results = await Promise.allSettled(
    ids.map(id =>
      fetch(`${BASE}/v1/inventory/variants/${id}`, {
        headers: { 'X-Auth-Token': TOKEN },
        cache: 'no-store',
      }).then(r => r.ok ? r.json() : null)
    )
  )

  const data = results.map(r => r.status === 'fulfilled' ? r.value : null)
  return NextResponse.json(data)
}
