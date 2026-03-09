'use client'
import { useState, useEffect } from 'react'

interface AlertRow {
  id: number
  name: string
  product_type: string
  usable_stock: number
  weekly_burn: number
  weekly_restock: number
  weeks_remaining: number
  suggested_order: number
}

function UrgencyBadge({ weeks }: { weeks: number }) {
  if (weeks < 2) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
      🔴 {weeks.toFixed(1)}w
    </span>
  )
  if (weeks < 4) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
      🟡 {weeks.toFixed(1)}w
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
      🟢 {weeks.toFixed(1)}w
    </span>
  )
}

export default function RestockAlertsTab() {
  const [data, setData] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/restock-alerts')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return <div className="text-gray-400 py-8 text-center">Calculating burn rates...</div>
  if (error) return <div className="text-red-400 py-8">Error: {error}</div>

  const critical = data.filter(r => r.weeks_remaining < 2).length
  const warning = data.filter(r => r.weeks_remaining >= 2 && r.weeks_remaining < 4).length

  return (
    <div>
      {/* Summary */}
      <div className="flex gap-4 mb-6">
        {critical > 0 && (
          <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Critical (&lt;2 wks)</p>
            <p className="text-2xl font-bold text-red-400">{critical}</p>
          </div>
        )}
        {warning > 0 && (
          <div className="px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Warning (&lt;4 wks)</p>
            <p className="text-2xl font-bold text-yellow-400">{warning}</p>
          </div>
        )}
        <div className="px-4 py-3 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Total Alerts</p>
          <p className="text-2xl font-bold text-white">{data.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Weekly Burn</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Current Stock</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Weeks Remaining</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-yellow-400">Suggested Order</th>
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
                <td className="px-4 py-3 text-right font-mono text-red-400">{row.weekly_burn}</td>
                <td className="px-4 py-3 text-right font-mono text-green-400">{Number(row.usable_stock).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <UrgencyBadge weeks={row.weeks_remaining} />
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-yellow-400">{row.suggested_order.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-green-400">✅ No restock alerts — all products are well-stocked!</div>
        )}
      </div>
    </div>
  )
}
