'use client'
import { useState, useEffect } from 'react'

interface DeadStockRow {
  id: number
  name: string
  product_type: string
  total_stock: number
  expired_units: number
  days_since_last_movement: number | null
}

export default function DeadStockTab() {
  const [data, setData] = useState<DeadStockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dead-stock')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading dead stock data...</div>
  if (error) return <div className="text-red-400 py-8">Error: {error}</div>

  const totalUnits = data.reduce((s, r) => s + Number(r.total_stock), 0)
  const totalExpired = data.reduce((s, r) => s + Number(r.expired_units), 0)

  return (
    <div>
      {/* Warning callout */}
      <div className="mb-6 p-4 rounded-lg border border-orange-500/30 bg-orange-500/10">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-orange-300">Disposal Candidates</p>
            <p className="text-sm text-orange-200/70 mt-1">
              These {data.length} products have had NO stock movement (consumption or restock) in the last 90 days.
              They are candidates for disposal or redistribution.
              Total units at risk: <strong className="text-orange-300">{totalUnits.toLocaleString()}</strong>
              {totalExpired > 0 && <> · <strong className="text-red-400">{totalExpired.toLocaleString()} already expired</strong></>}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total Stock</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-400">Expired Units</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Days Since Movement</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{row.product_type}</td>
                <td className="px-4 py-3 text-right font-mono text-white">{Number(row.total_stock).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-mono"
                  style={{ color: Number(row.expired_units) > 0 ? '#ef4444' : 'var(--muted)' }}>
                  {Number(row.expired_units) > 0 ? Number(row.expired_units).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono"
                  style={{ color: (row.days_since_last_movement ?? 999) > 180 ? '#ef4444' : '#f59e0b' }}>
                  {row.days_since_last_movement != null ? `${row.days_since_last_movement}d` : '> 365d'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-green-400">✅ No dead stock — all products have recent movement!</div>
        )}
      </div>
    </div>
  )
}
