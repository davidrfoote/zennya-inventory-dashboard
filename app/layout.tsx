import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zennya Inventory Dashboard',
  description: 'Stock movement and inventory analytics',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <header className="border-b px-6 py-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <h1 className="text-lg font-bold text-white">Zennya Inventory Dashboard</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Stock Movement Analytics · remedy DB</p>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </body>
    </html>
  )
}
