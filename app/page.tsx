'use client'
import { useState } from 'react'
import StockOverviewTab from '@/components/StockOverviewTab'
import WeeklyMovementTab from '@/components/WeeklyMovementTab'
import RestockAlertsTab from '@/components/RestockAlertsTab'
import DeadStockTab from '@/components/DeadStockTab'

const TABS = [
  { id: 'overview', label: '📊 Stock Overview' },
  { id: 'movement', label: '📈 Weekly Movement' },
  { id: 'alerts', label: '🚨 Restock Alerts' },
  { id: 'deadstock', label: '🗄️ Dead Stock' },
]

export default function Home() {
  const [active, setActive] = useState('overview')

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className="px-4 py-2 text-sm font-medium transition-colors rounded-t"
            style={{
              color: active === tab.id ? 'white' : 'var(--muted)',
              background: active === tab.id ? 'var(--accent)' : 'transparent',
              borderBottom: active === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active === 'overview' && <StockOverviewTab />}
      {active === 'movement' && <WeeklyMovementTab />}
      {active === 'alerts' && <RestockAlertsTab />}
      {active === 'deadstock' && <DeadStockTab />}
    </div>
  )
}
