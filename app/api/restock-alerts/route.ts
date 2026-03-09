import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Reuse stock-overview aggregations + filter to burning products
    const [rows] = await pool.execute(`
      SELECT
        pm.id,
        pm.name,
        pm.product_type,
        COALESCE(SUM(
          CASE WHEN (p.expire_at IS NULL OR p.expire_at > NOW()) THEN psl.quantity ELSE 0 END
        ), 0) AS usable_stock,
        COALESCE((
          SELECT SUM(ABS(psh.quantity))
          FROM product_stock_history psh
          JOIN product p2 ON p2.id = psh.product_id
          WHERE p2.model_id = pm.id
            AND psh.timestamp >= DATE_SUB(NOW(), INTERVAL 28 DAY)
            AND ((psh.activity_type = 'assembly' AND psh.movement = 'minus') OR psh.activity_type = 'fulfillment')
          LIMIT 1
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
          LIMIT 1
        ), 0) AS restock_4wk
      FROM product_model pm
      JOIN product p ON p.model_id = pm.id
      JOIN product_stock_location psl ON psl.product_id = p.id
      JOIN stock_location sl ON sl.id = psl.stock_location_id
      WHERE pm.hidden = 0
        AND sl.type IN ('main', 'satellite')
        AND pm.id IN (
          SELECT DISTINCT p3.model_id FROM product p3
          JOIN product_stock_history psh3 ON psh3.product_id = p3.id
          WHERE psh3.timestamp >= DATE_SUB(NOW(), INTERVAL 90 DAY)
          LIMIT 5000
        )
      GROUP BY pm.id, pm.name, pm.product_type
      HAVING consumption_4wk > restock_4wk AND consumption_4wk > 0
      ORDER BY usable_stock ASC
      LIMIT 200
    `)

    // Compute derived fields
    const alerts = (rows as Record<string, number | string>[]).map(row => {
      const weeklyBurn = Number(row.consumption_4wk) / 4
      const weeklyRestock = Number(row.restock_4wk) / 4
      const weeksRemaining = weeklyBurn > 0 ? Number(row.usable_stock) / weeklyBurn : 999
      const suggestedOrder = Math.max(0, Math.ceil(4 * weeklyBurn - Number(row.usable_stock)))
      return {
        id: row.id,
        name: row.name,
        product_type: row.product_type,
        usable_stock: row.usable_stock,
        weekly_burn: Math.round(weeklyBurn * 10) / 10,
        weekly_restock: Math.round(weeklyRestock * 10) / 10,
        weeks_remaining: Math.round(weeksRemaining * 10) / 10,
        suggested_order: suggestedOrder,
      }
    })

    alerts.sort((a, b) => a.weeks_remaining - b.weeks_remaining)
    return NextResponse.json(alerts)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
