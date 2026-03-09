import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT
        pm.id,
        pm.name,
        pm.product_type,
        SUM(psl.quantity) AS total_stock,
        SUM(CASE WHEN p.expire_at IS NOT NULL AND p.expire_at < NOW() THEN psl.quantity ELSE 0 END) AS expired_units,
        DATEDIFF(NOW(), MAX(psh_last.last_ts)) AS days_since_last_movement
      FROM product_model pm
      JOIN product p ON p.model_id = pm.id
      JOIN product_stock_location psl ON psl.product_id = p.id
      JOIN stock_location sl ON sl.id = psl.stock_location_id
      LEFT JOIN (
        SELECT product_id, MAX(timestamp) AS last_ts
        FROM product_stock_history
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 365 DAY)
        GROUP BY product_id
      ) psh_last ON psh_last.product_id = p.id
      WHERE pm.hidden = 0
        AND sl.type IN ('main', 'satellite')
        AND pm.id NOT IN (
          SELECT DISTINCT p2.model_id
          FROM product p2
          JOIN product_stock_history psh2 ON psh2.product_id = p2.id
          WHERE psh2.timestamp >= DATE_SUB(NOW(), INTERVAL 90 DAY)
          LIMIT 10000
        )
      GROUP BY pm.id, pm.name, pm.product_type
      HAVING total_stock > 0
      ORDER BY days_since_last_movement DESC
      LIMIT 300
    `)
    return NextResponse.json(rows)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
