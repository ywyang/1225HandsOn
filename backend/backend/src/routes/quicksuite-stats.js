import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Get earliest submission (top 10)
    const earliestResult = await query(`
      SELECT user_name, company_name, stock_code, report_period, revenue, created_at
      FROM company_reports
      ORDER BY created_at ASC
      LIMIT 10
    `);

    // Get all reports
    const allReportsResult = await query(`
      SELECT user_name, company_name, stock_code, report_period, revenue, 
             performance_summary, employee_id, created_at
      FROM company_reports
      ORDER BY created_at DESC
    `);

    // Get highest revenue (top 10)
    const highestRevenueResult = await query(`
      SELECT user_name, company_name, stock_code, report_period, revenue, created_at
      FROM company_reports
      ORDER BY revenue DESC, created_at ASC
      LIMIT 10
    `);

    // Get reports grouped by user
    const userGroupsResult = await query(`
      SELECT 
        user_name,
        COUNT(*) as report_count,
        json_agg(json_build_object(
          'company_name', company_name,
          'stock_code', stock_code,
          'report_period', report_period,
          'revenue', revenue,
          'created_at', created_at
        ) ORDER BY created_at DESC) as reports
      FROM company_reports
      GROUP BY user_name
      HAVING COUNT(*) > 1
      ORDER BY report_count DESC
    `);

    res.json({
      earliest: earliestResult.rows,
      allReports: allReportsResult.rows,
      highestRevenue: highestRevenueResult.rows,
      userGroups: userGroupsResult.rows
    });
  } catch (error) {
    console.error('Quick Suite stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
