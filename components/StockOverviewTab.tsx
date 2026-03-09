'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'

interface VariantMeta { id: number; sku: string }
interface Model { id: number; name: string; description: string; supplier?: { name: string }; variants: VariantMeta[] }
interface StockEntry { quantity: number; available_quantity: number; reserved_quantity: number; committed_quantity: number; warehouse: { id: number; name: string } }
interface VariantStock { id: number; sku: string; stocks: StockEntry[]; last_updated?: string }

function StockBadge({ available }: { available: number }) {
  if (available === 0) return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">● Out</span>
  if (available <= 10) return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">● Low</span>
  return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">● OK</span>
}

export default function StockOverviewTab() {
  const [models, setModels] = useState<Model[]>([])
  const [variantStock, setVariantStock] = useState<Record<number, VariantStock>>({})
  const [loading, setLoading] = useState(true)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [offset, setOffset] = useState(200)
  const [lastRefreshed, setLastRefreshed] = useState('')

  const fetchModels = useCallback(async (newOffset = 0, append = false) => {
    try {
      const batches = await Promise.all([0, 50, 100, 150].map(o =>
        fetch(`/api/models?q=&limit=50&offset=${newOffset + o}`).then(r => r.json())
      ))
      const all: Model[] = batches.flatMap(b => b.list || [])
      setModels(prev => append ? [...prev, ...all] : all)
      setOffset(newOffset + 200)
      setLastRefreshed(new Date().toLocaleTimeString())
    } catch (e: unknown) {
      setError(String(e))
    }
  }, [])

  const fetchVariantsForModels = useCallback(async (mods: Model[]) => {
    const ids = mods.flatMap(m => m.variants.map(v => v.id)).filter(id => !variantStock[id])
    if (ids.length === 0) return
    setLoadingVariants(true)
    // Batch in groups of 20
    for (let i = 0; i < ids.length; i += 20) {
      const batch = ids.slice(i, i + 20)
      const results: (VariantStock | null)[] = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: batch }),
      }).then(r => r.json()).catch(() => batch.map(() => null))
      setVariantStock(prev => {
        const next = { ...prev }
        results.forEach((v, idx) => { if (v) next[batch[idx]] = v })
        return next
      })
    }
    setLoadingVariants(false)
  }, [variantStock])

  useEffect(() => {
    setLoading(true)
    fetchModels(0, false).then(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (models.length > 0) fetchVariantsForModels(models)
  }, [models])

  const filtered = useMemo(() =>
    models.filter(m => search === '' || m.name.toLowerCase().includes(search.toLowerCase())),
    [models, search])

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const loadMore = async () => {
    await fetchModels(offset, true)
  }

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading inventory models...</div>
  if (error) return <div className="text-red-400 py-8">Error: {error}</div>

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search product name..."
          className="px-3 py-2 rounded text-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: 240 }}
        />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{filtered.length} products</span>
        {loadingVariants && <span className="text-xs text-indigo-400">Loading stock data...</span>}
        {lastRefreshed && <span className="ml-auto text-xs px-2 py-1 rounded" style={{ background: 'var(--card)', color: 'var(--muted)' }}>🕐 Last refreshed: {lastRefreshed}</span>}
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide w-8" style={{ color: 'var(--muted)' }}></th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Product Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>SKU</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Warehouse</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-green-400">Available</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-yellow-400">Reserved</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Total</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((model, i) => {
              const variantIds = model.variants.map(v => v.id)
              const stocks = variantIds.map(id => variantStock[id]).filter(Boolean)
              const allStocks = stocks.flatMap(v => v.stocks || [])
              const totalAvail = allStocks.reduce((s, st) => s + st.available_quantity, 0)
              const totalReserved = allStocks.reduce((s, st) => s + st.reserved_quantity, 0)
              const totalQty = allStocks.reduce((s, st) => s + st.quantity, 0)
              const warehouses = [...new Set(allStocks.map(st => st.warehouse.name))].join(', ')
              const isExpanded = expanded.has(model.id)
              const hasStock = stocks.length > 0
              const firstVariant = model.variants[0]

              return [
                <tr
                  key={model.id}
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <td className="px-4 py-3 text-center">
                    {model.variants.length > 0 && (
                      <button onClick={() => toggleExpand(model.id)} className="text-xs" style={{ color: 'var(--muted)' }}>
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{model.name}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--muted)' }}>{firstVariant?.sku || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{hasStock ? (warehouses || '—') : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-400">{hasStock ? totalAvail : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-yellow-400">{hasStock ? totalReserved : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{hasStock ? totalQty : '—'}</td>
                  <td className="px-4 py-3 text-center">{hasStock ? <StockBadge available={totalAvail} /> : <span className="text-xs" style={{ color: 'var(--muted)' }}>...</span>}</td>
                </tr>,
                isExpanded && stocks.length > 0 && stocks.flatMap(variant =>
                  (variant.stocks || []).map((st, si) => (
                    <tr key={`${variant.id}-${si}`} style={{ background: 'rgba(99,102,241,0.05)', borderBottom: '1px solid var(--border)' }}>
                      <td></td>
                      <td className="px-4 py-2 text-xs pl-8" style={{ color: 'var(--muted)' }}>↳ {variant.sku}</td>
                      <td className="px-4 py-2 text-xs font-mono" style={{ color: 'var(--muted)' }}>{variant.sku}</td>
                      <td className="px-4 py-2 text-xs" style={{ color: 'var(--text)' }}>{st.warehouse.name}</td>
                      <td className="px-4 py-2 text-right text-xs font-mono text-green-400">{st.available_quantity}</td>
                      <td className="px-4 py-2 text-right text-xs font-mono text-yellow-400">{st.reserved_quantity}</td>
                      <td className="px-4 py-2 text-right text-xs font-mono text-white">{st.quantity}</td>
                      <td className="px-4 py-2 text-center"><StockBadge available={st.available_quantity} /></td>
                    </tr>
                  ))
                )
              ].flat().filter(Boolean)
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12" style={{ color: 'var(--muted)' }}>No products match filter</div>}
      </div>
      <div className="mt-4 flex justify-center">
        <button
          onClick={loadMore}
          className="px-6 py-2 rounded font-medium text-sm"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          Load More (offset {offset})
        </button>
      </div>
    </div>
  )
}
