'use client'
import { useState, useEffect, useCallback } from 'react'

interface VariantMeta { id: number; sku: string }
interface Model { id: number; name: string; variants: VariantMeta[] }
interface StockEntry { quantity: number; available_quantity: number; reserved_quantity: number; warehouse: { id: number; name: string } }
interface VariantStock { id: number; sku: string; stocks: StockEntry[]; last_updated?: string }

interface DeadRow {
  modelId: number
  name: string
  sku: string
  lastUpdated: string
  status: string
}

export default function DeadStockTab() {
  const [rows, setRows] = useState<DeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const batches = await Promise.all([0, 50, 100, 150].map(o =>
        fetch(`/api/models?q=&limit=50&offset=${o}`).then(r => r.json())
      ))
      const models: Model[] = batches.flatMap(b => b.list || [])

      const allVariantIds = models.flatMap(m => m.variants.map(v => v.id))
      const stockMap: Record<number, VariantStock> = {}
      for (let i = 0; i < allVariantIds.length; i += 20) {
        const batch = allVariantIds.slice(i, i + 20)
        const results: (VariantStock | null)[] = await fetch('/api/variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: batch }),
        }).then(r => r.json()).catch(() => batch.map(() => null))
        results.forEach((v, idx) => { if (v) stockMap[batch[idx]] = v })
      }

      const dead: DeadRow[] = []
      for (const model of models) {
        const variantData = model.variants.map(v => stockMap[v.id]).filter(Boolean)
        if (variantData.length === 0) continue
        const allStocks = variantData.flatMap(v => v.stocks || [])
        const totalQty = allStocks.reduce((s, st) => s + st.quantity, 0)
        if (totalQty === 0) {
          const lastVariant = variantData.sort((a, b) =>
            new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime()
          )[0]
          dead.push({
            modelId: model.id,
            name: model.name,
            sku: model.variants[0]?.sku || '—',
            lastUpdated: lastVariant?.last_updated ? new Date(lastVariant.last_updated).toLocaleDateString() : '—',
            status: 'No stock',
          })
        }
      }

      setRows(dead)
      setLastRefreshed(new Date().toLocaleTimeString())
    } catch (e: unknown) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="text-gray-400 py-8 text-center">Scanning for dead stock...</div>
  if (error) return <div className="text-red-400 py-8">Error: {error}</div>

  return (
    <div>
      {rows.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-orange-500/30 bg-orange-500/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-orange-300">Dead Stock Candidates</p>
              <p className="text-sm text-orange-200/70 mt-1">
                {rows.length} products have <strong>zero stock</strong> across all warehouses. These are candidates for removal from the system.
              </p>
            </div>
          </div>
        </div>
      )}
      {lastRefreshed && <div className="mb-4 text-right"><span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--card)', color: 'var(--muted)' }}>🕐 {lastRefreshed}</span></div>}

      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Product Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>SKU</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Last Updated</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.modelId} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--muted)' }}>{row.sku}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{row.lastUpdated}</td>
                <td className="px-4 py-3"><span className="text-xs font-bold text-red-400">🗑️ {row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="text-center py-12 text-green-400">✅ No dead stock found!</div>}
      </div>
    </div>
  )
}
