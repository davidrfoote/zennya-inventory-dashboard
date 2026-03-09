import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT
        pm.id AS model_id,
        pm.name,
        YEARWEEK(psh.timestamp, 1) AS yw,
        DATE_FORMAT(MIN(psh.timestamp), '%Y-%m-%d') AS week_start,
        SUM(CASE
          WHEN (psh.activity_type = 'assembly' AND psh.movement = 'minus') OR psh.activity_type = 'fulfillment'
          THEN ABS(psh.quantity) ELSE 0
        END) AS consumption,
        SUM(CASE
          WHEN (psh.activity_type = 'increase' AND psh.movement = 'plus')
            OR (psh.activity_type = 'transfer' AND psh.movement = 'plus' AND sl.type IN ('main','satellite'))
          THEN psh.quantity ELSE 0
        END) AS restock
      FROM product_stock_history psh
      JOIN product p ON p.id = psh.product_id
      JOIN product_model pm ON pm.id = p.model_id
      LEFT JOIN stock_location sl ON sl.id = psh.stock_location_id
      WHERE psh.timestamp >= DATE_SUB(NOW(), INTERVAL 56 DAY)
        AND pm.hidden = 0
      GROUP BY pm.id, pm.name, YEARWEEK(psh.timestamp, 1)
      ORDER BY pm.name, yw
      LIMIT 50000
    `)
    return NextResponse.json(rows)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
