'use client'
import { useState, useEffect, useCallback } from 'react'

interface VariantMeta { id: number; sku: string }
interface Model { id: number; name: string; variants: VariantMeta[] }
interface StockEntry { quantity: number; available_quantity: number; reserved_quantity: number; warehouse: { id: number; name: string } }
interface VariantStock { id: number; sku: string; stocks: StockEntry[] }

interface AlertRow {
  modelId: number
  name: string
  sku: string
  totalAvailable: number
  totalReserved: number
  totalQuantity: number
  warehouses: string
}

export default function RestockAlertsTab() {
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch first 200 models
      const batches = await Promise.all([0, 50, 100, 150].map(o =>
        fetch(`/api/models?q=&limit=50&offset=${o}`).then(r => r.json())
      ))
      const models: Model[] = batches.flatMap(b => b.list || [])

      // Fetch all variant stocks in batches of 20
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

      // Build alert rows: products where totalAvailable === 0
      const rows: AlertRow[] = []
      for (const model of models) {
        const stocks = model.variants.map(v => stockMap[v.id]).filter(Boolean)
        if (stocks.length === 0) continue
        const allStocks = stocks.flatMap(v => v.stocks || [])
        const totalAvail = allStocks.reduce((s, st) => s + st.available_quantity, 0)
        const totalReserved = allStocks.reduce((s, st) => s + st.reserved_quantity, 0)
        const totalQty = allStocks.reduce((s, st) => s + st.quantity, 0)

        if (totalAvail <= 10) {
          rows.push({
            modelId: model.id,
            name: model.name,
            sku: model.variants[0]?.sku || '—',
            totalAvailable: totalAvail,
            totalReserved,
            totalQuantity: totalQty,
            warehouses: [...new Set(allStocks.map(st => st.warehouse.name))].join(', '),
          })
        }
      }

      rows.sort((a, b) => a.totalQuantity - b.totalQuantity)
      setAlerts(rows)
      setLastRefreshed(new Date().toLocaleTimeString())
    } catch (e: unknown) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="text-gray-400 py-8 text-center">Analyzing stock levels...</div>
  if (error) return <div className="text-red-400 py-8">Error: {error}</div>

  const outOfStock = alerts.filter(r => r.totalAvailable === 0)
  const lowStock = alerts.filter(r => r.totalAvailable > 0 && r.totalAvailable <= 10)

  return (
    <div>
      <div className="flex gap-4 mb-6 items-center">
        <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Out of Stock</p>
          <p className="text-2xl font-bold text-red-400">{outOfStock.length}</p>
        </div>
        <div className="px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Low Stock (≤10)</p>
          <p className="text-2xl font-bold text-yellow-400">{lowStock.length}</p>
        </div>
        <div className="px-4 py-3 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Total Alerts</p>
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
        </div>
        {lastRefreshed && <span className="ml-auto text-xs px-2 py-1 rounded" style={{ background: 'var(--card)', color: 'var(--muted)' }}>🕐 {lastRefreshed}</span>}
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Product Name</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-green-400">Total Available</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-yellow-400">Total Reserved</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total Qty</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Warehouses</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Alert</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((row, i) => (
              <tr key={row.modelId} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                <td className="px-4 py-3 text-right font-mono text-green-400">{row.totalAvailable}</td>
                <td className="px-4 py-3 text-right font-mono text-yellow-400">{row.totalReserved}</td>
                <td className="px-4 py-3 text-right font-mono text-white">{row.totalQuantity}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{row.warehouses}</td>
                <td className="px-4 py-3">
                  {row.totalAvailable === 0
                    ? <span className="text-xs font-bold text-red-400">⚠️ Out of stock</span>
                    : <span className="text-xs font-bold text-yellow-400">⚠️ Low stock (≤10 units)</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {alerts.length === 0 && <div className="text-center py-12 text-green-400">✅ No restock alerts!</div>}
      </div>
    </div>
  )
}
