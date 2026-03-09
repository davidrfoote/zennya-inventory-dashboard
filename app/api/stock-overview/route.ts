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
        COALESCE(SUM(
          CASE WHEN (p.expire_at IS NULL OR p.expire_at > NOW()) THEN psl.quantity ELSE 0 END
        ), 0) AS usable_stock,
        COALESCE(SUM(
          CASE WHEN p.expire_at IS NOT NULL AND p.expire_at < NOW() THEN psl.quantity ELSE 0 END
        ), 0) AS expired_stock,
        COALESCE((
          SELECT SUM(ABS(psh.quantity))
          FROM product_stock_history psh
          JOIN product p2 ON p2.id = psh.product_id
          WHERE p2.model_id = pm.id
            AND psh.timestamp >= DATE_SUB(NOW(), INTERVAL 28 DAY)
            AND ((psh.activity_type = 'assembly' AND psh.movement = 'minus') OR psh.activity_type = 'fulfillment')
        ), 0) AS consumption_4wk,
        COALESCE((
          SELECT SUM(psh.quantity)
          FROM product_stock_history psh
          JOIN product p2 ON p2.id = psh.product_id
          LEFT JOIN stock_location sl2 ON sl2.id = psh.stock_location_id
          WHERE p2.model_id = pm.id
            AND psh.timestamp >= DATE_SUB(NOW(), INTERVAL 28 DAY)
            AND (
              (psh.activity_type = 'increase' AND psh.movement = 'plus')
              OR (psh.activity_type = 'transfer' AND psh.movement = 'plus' AND sl2.type IN ('main','satellite'))
            )
        ), 0) AS restock_4wk
      FROM product_model pm
      JOIN product p ON p.model_id = pm.id
      JOIN product_stock_location psl ON psl.product_id = p.id
      JOIN stock_location sl ON sl.id = psl.stock_location_id
      -- Only include products with movement in last 90 days (via EXISTS)
      WHERE pm.hidden = 0
        AND sl.type IN ('main', 'satellite')
        AND EXISTS (
          SELECT 1
          FROM product_stock_history psh3
          JOIN product p3 ON p3.id = psh3.product_id
          WHERE p3.model_id = pm.id
            AND psh3.timestamp >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        )
      GROUP BY pm.id, pm.name, pm.product_type
      ORDER BY usable_stock DESC
      LIMIT 500
    `)
    return NextResponse.json(rows)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
