'use client'
import { useState, useEffect, useMemo } from 'react'

interface StockRow {
  id: number
  name: string
  product_type: string
  usable_stock: number
  expired_stock: number
  consumption_4wk: number
  restock_4wk: number
}

function Trend({ c, r }: { c: number; r: number }) {
  if (r > c) return <span className="text-green-400 font-bold">↑</span>
  if (c > r && c > 0) return <span className="text-red-400 font-bold">↓</span>
  return <span className="text-gray-400">→</span>
}

export default function StockOverviewTab() {
  const [data, setData] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/stock-overview')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const types = useMemo(() => Array.from(new Set(data.map(r => r.product_type))).sort(), [data])

  const filtered = useMemo(() =>
    data.filter(r =>
      (typeFilter.length === 0 || typeFilter.includes(r.product_type)) &&
      (search === '' || r.name.toLowerCase().includes(search.toLowerCase()))
    ), [data, typeFilter, search])

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading stock data...</div>
  if (error) return <div className="text-red-400 py-8">Error: {error}</div>

  const toggleType = (t: string) =>
    setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search product..."
          className="px-3 py-2 rounded text-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: 200 }}
        />
        <div className="flex flex-wrap gap-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: typeFilter.includes(t) ? 'var(--accent)' : 'var(--card)',
                border: '1px solid var(--border)',
                color: typeFilter.includes(t) ? 'white' : 'var(--muted)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-xs self-center" style={{ color: 'var(--muted)' }}>{filtered.length} products</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-green-400">Usable Stock</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-red-400">Expired</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>4-wk Consumption</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>4-wk Restock</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{row.product_type}</td>
                <td className="px-4 py-3 text-right font-mono text-green-400">{Number(row.usable_stock).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: Number(row.expired_stock) > 0 ? 'var(--red)' : 'var(--muted)' }}>
                  {Number(row.expired_stock).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--text)' }}>{Number(row.consumption_4wk).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--text)' }}>{Number(row.restock_4wk).toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-lg">
                  <Trend c={Number(row.consumption_4wk)} r={Number(row.restock_4wk)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>No products match filters</div>
        )}
      </div>
    </div>
  )
}
