const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const router = express.Router();
const pool = require('./db'); 






app.get('/peak-hours-data', async (req, res) => {
  try {
    const { start_date, end_date, day_of_week } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: "start_date and end_date are required" });
    }

    let dayFilter = '';
    const values = [start_date, end_date];

    if (day_of_week) {
      dayFilter = `AND TRIM(TO_CHAR(o.date, 'Day')) = $3`;
      values.push(day_of_week);
    }

    const query = `
    WITH ranked_orders AS (
        SELECT 
            TRIM(TO_CHAR(o.date, 'Day')) AS day_of_week,
            EXTRACT(HOUR FROM o.time AT TIME ZONE 'UTC') AS hour_of_day,
            mi.main_category,
            COUNT(*) AS order_count,
            RANK() OVER (PARTITION BY TRIM(TO_CHAR(o.date, 'Day')), EXTRACT(HOUR FROM o.time) ORDER BY COUNT(*) DESC) AS rnk
        FROM orders o
        JOIN order_details od ON o.order_id = od.order_id
        JOIN menu_items mi ON od.menu_id = mi.menu_id
        WHERE o.date BETWEEN $1 AND $2
        AND EXTRACT(HOUR FROM o.time) BETWEEN 10 AND 21
        ${dayFilter}
        GROUP BY day_of_week, hour_of_day, mi.main_category
    )
    SELECT json_agg(json_build_object(
        'day', day_of_week,
        'hour_of_day', hour_of_day,
        'category', main_category,
        'order_count', order_count
    )) AS result
    FROM ranked_orders
    WHERE rnk = 1;
    `;

    const { rows } = await pool.query(query, values);

    res.json(rows[0].result || []); 
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ error: `Error retrieving peak hours data: ${e.message}` });
  }
});





app.get('/highest-selling-products', async (req, res) => {
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



app.get('/call-sales-forecast', async (req, res) => {
  try {
    // Call the Flask /sales-forecast route using GET method
    const response = await axios.get('https://lolos-place-backend.onrender.com/sales-forecast'); // Flask server URL
    // Send the response data from Flask to the client
    res.json(response.data);
    console.log(response.data);
  } catch (error) {
    console.error('Error calling Flask sales-forecast route:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error calling Flask sales-forecast route' });
  }
});






app.get('/call-feedback-graph', async (req, res) => {
  try {
      // Call the Flask API
      const response = await axios.get('https://lolos-place-backend.onrender.com/feedback-graph', null, {
          responseType: 'arraybuffer', // To handle binary data like SVG
      });

      // Set headers and send the SVG content
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(response.data);
  } catch (error) {
      console.error('Error calling Flask route:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Error fetching feedback graph' });
  }
});





app.get('/call-feedback-stats', async (req, res) => {
  try {
      // Call the Flask API
      const response = await axios.get('https://lolos-place-backend.onrender.com/feedback-stats');

      // Forward the JSON data received from Flask
      res.json(response.data);
  } catch (error) {
      console.error('Error calling Flask route:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Error fetching feedback stats' });
  }
});







app.post('/api/call-analyze-sentiment', async (req, res) => {
  try {
      // Forward the JSON body to the Flask API with correct headers
      const response = await axios.post('https://lolos-place-backend.onrender.com/api/analyze-sentiment', req.body, {
          headers: {
              'Content-Type': 'application/json',
          },
      });

      // Send the Flask API's response back to the client
      res.json(response.data);
  } catch (error) {
      console.error('Error calling Flask route:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Error analyzing sentiment' });
  }
});



app.get('/node-test-db', async (req, res) => {
  try {
    // Forward the request to the Flask API
    const response = await axios.get('https://lolos-place-backend.onrender.com/test-db');

    // Send the response data back to the client
    res.json({
      message: 'Data fetched successfully from Flask API',
      data: response.data,
    });
  } catch (error) {
    // Handle errors and send the appropriate response
    res.status(500).json({
      message: 'Failed to fetch data from Flask API',
      error: error.response ? error.response.data : error.message,
    });
  }
});



// Mounting the router on the main app
app.use(router);

module.exports = router;