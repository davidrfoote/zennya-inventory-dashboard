import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zennya Inventory Dashboard',
  description: 'Real-time inventory stock monitoring',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
          <header style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>📦</span>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>Zennya Inventory Dashboard</h1>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Real-time stock monitoring via Inventory API</p>
              </div>
            </div>
          </header>
          <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
