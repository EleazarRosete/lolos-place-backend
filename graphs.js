const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const router = express.Router();
const pool = require('./db'); 


router.get('/peak-hours-data', async (req, res) => {
  try {
    // Execute the SQL query
    const query = `
      SELECT TRIM(TO_CHAR(date, 'Day')) AS day_of_week,
             EXTRACT(HOUR FROM time AT TIME ZONE 'UTC') AS hour_of_day,
             COUNT(*) AS order_count
      FROM orders
      WHERE EXTRACT(HOUR FROM time) BETWEEN 10 AND 21
      GROUP BY day_of_week, hour_of_day
      ORDER BY day_of_week, hour_of_day;
    `;
    const { rows } = await pool.query(query);

    // Define days and peak hours
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 11 }, (_, i) => i + 10); // Peak hours: 10 AM to 9 PM

    // Initialize the data structure
    const orderData = {};
    days.forEach(day => {
      orderData[day] = {};
      hours.forEach(hour => {
        orderData[day][hour] = 0;
      });
    });

    // Populate orderData with query results
    rows.forEach(row => {
      const { day_of_week, hour_of_day, order_count } = row;
      if (orderData[day_of_week]) {
        orderData[day_of_week][parseInt(hour_of_day)] = order_count;
      }
    });

    // Find the peak hour for each day
    const highestOrders = {};
    days.forEach(day => {
      const dayData = orderData[day];
      const highestHour = Object.keys(dayData).reduce((a, b) => dayData[a] > dayData[b] ? a : b);
      highestOrders[day] = {
        hour: highestHour,
        order_count: dayData[highestHour],
      };
    });

    // Return the response
    res.json({ highest_orders: highestOrders });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ error: `Error retrieving peak hours data: ${e.message}` });
  }
});




router.get('/highest-selling-products', async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    // SQL query to fetch the highest selling products
    const query = `
      WITH monthly_sales AS (
        SELECT 
          product_name,
          DATE_TRUNC('month', date::DATE) AS sale_month,
          SUM(quantity_sold) AS total_quantity_sold
        FROM sales_data
        WHERE EXTRACT(YEAR FROM date::DATE) = $1
        AND EXTRACT(MONTH FROM date::DATE) = $2
        GROUP BY product_name, DATE_TRUNC('month', date::DATE)
        ORDER BY sale_month, total_quantity_sold DESC
      )
      SELECT 
        sale_month,
        product_name,
        total_quantity_sold
      FROM monthly_sales;
    `;

    // Execute the query with the provided year and month
    const result = await pool.query(query, [year, month]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No sales data available for the given month and year' });
    }

    // Prepare data for visualization
    const data = {};
    result.rows.forEach(row => {
      const saleMonth = row.sale_month.toISOString().slice(0, 7); // Format as Year-Month
      if (!data[saleMonth]) {
        data[saleMonth] = [];
      }
      data[saleMonth].push({
        product_name: row.product_name,
        quantity_sold: row.total_quantity_sold,
      });
    });

    return res.json(data);

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Error in fetching product demand per month: ' + err.message });
  }
});



// Mounting the router on the main app
app.use(router);

module.exports = router;