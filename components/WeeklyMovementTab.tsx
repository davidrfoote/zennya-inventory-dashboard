'use client'
import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MovementRow {
  model_id: number
  name: string
  yw: number
  week_start: string
  consumption: number
  restock: number
}

export default function WeeklyMovementTab() {
  const [data, setData] = useState<MovementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string>('__all__')

  useEffect(() => {
    fetch('/api/weekly-movement')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const products = useMemo(() => {
    const names = Array.from(new Set(data.map(r => r.name))).sort()
    return ['__all__', ...names]
  }, [data])

  const weeks = useMemo(() => {
    const wks = Array.from(new Set(data.map(r => r.yw))).sort()
    return wks
  }, [data])

  // Chart data: aggregate across selected product or all
  const chartData = useMemo(() => {
    return weeks.map(wk => {
      const rows = data.filter(r => r.yw === wk && (selectedProduct === '__all__' || r.name === selectedProduct))
      const ws = rows[0]?.week_start || String(wk)
      return {
        week: ws,
        consumption: rows.reduce((s, r) => s + Number(r.consumption), 0),
        restock: rows.reduce((s, r) => s + Number(r.restock), 0),
      }
    })
  }, [data, weeks, selectedProduct])

  // Table: product × week net change
  const tableProducts = useMemo(() => {
    const names = selectedProduct === '__all__'
      ? Array.from(new Set(data.map(r => r.name))).sort()
      : [selectedProduct]
    return names.map(name => {
      const weekMap: Record<number, number> = {}
      data.filter(r => r.name === name).forEach(r => {
        weekMap[r.yw] = Number(r.restock) - Number(r.consumption)
      })
      return { name, weekMap }
    })
  }, [data, selectedProduct])

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading movement data...</div>
  if (error) return <div className="text-red-400 py-8">Error: {error}</div>

  return (
    <div>
      {/* Filter */}
      <div className="mb-4">
        <select
          value={selectedProduct}
          onChange={e => setSelectedProduct(e.target.value)}
          className="px-3 py-2 rounded text-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: 250 }}
        >
          <option value="__all__">All Products (aggregate)</option>
          {products.filter(p => p !== '__all__').map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>8-Week Movement</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="week" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <Legend />
            <Bar dataKey="consumption" name="Consumption" fill="#ef4444" radius={[2,2,0,0]} />
            <Bar dataKey="restock" name="Restock" fill="#22c55e" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Net change table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Product</th>
              {weeks.map(wk => (
                <th key={wk} className="text-right px-3 py-3 text-xs font-semibold" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  Wk {String(wk).slice(-2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableProducts.slice(0, 50).map((row, i) => (
              <tr key={row.name} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-2 font-medium text-white max-w-xs truncate">{row.name}</td>
                {weeks.map(wk => {
                  const net = row.weekMap[wk] ?? 0
                  return (
                    <td key={wk} className="px-3 py-2 text-right font-mono text-xs"
                      style={{ color: net > 0 ? '#22c55e' : net < 0 ? '#ef4444' : 'var(--muted)' }}>
                      {net === 0 ? '–' : (net > 0 ? '+' : '') + net}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
