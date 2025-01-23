const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const router = express.Router();
const pool = require('./db'); 



router.get('/peak-hours-data', async (req, res) => {
  try {
    // Get the selected day from query parameters (e.g., ?day=Monday)
    const { day } = req.query;

    if (!day) {
      return res.status(400).json({ error: 'Day parameter is required.' });
    }

    // Ensure the selected day is valid
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ error: 'Invalid day parameter. Please provide a valid day.' });
    }

    // Execute the SQL query with the selected day filter
    const query = `
      SELECT TRIM(TO_CHAR(date, 'Day')) AS day_of_week,
             EXTRACT(HOUR FROM time AT TIME ZONE 'UTC') AS hour_of_day,
             COUNT(*) AS order_count
      FROM orders
      WHERE TRIM(TO_CHAR(date, 'Day')) = $1 
        AND EXTRACT(HOUR FROM time) BETWEEN 10 AND 21
      GROUP BY day_of_week, hour_of_day
      ORDER BY hour_of_day;
    `;
    const { rows } = await pool.query(query, [day]);

    // Define hours from 10 AM to 9 PM (inclusive)
    const hours = Array.from({ length: 11 }, (_, i) => i + 10); // Peak hours: 10 AM to 9 PM

    // Initialize the order data structure with 0 orders for each hour
    const orderData = {};
    hours.forEach(hour => {
      orderData[hour] = 0; // Initialize all hours to 0 orders
    });

    // Populate orderData with query results, updating only the hours that have orders
    rows.forEach(row => {
      const { hour_of_day, order_count } = row;
      orderData[parseInt(hour_of_day)] = parseInt(order_count); // Ensure the order count is an integer
    });

    // Ensure hour 21 (9 PM) is included if there are no orders
    if (orderData[21] === undefined) {
      orderData[21] = 0; // Set to 0 if no orders are found for 9 PM
    }

    // Return the response with all hours, including those with 0 orders
    res.json({ day: day, order_data: orderData });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ error: `Error retrieving peak hours data: ${e.message}` });
  }
});




router.get('/highest-selling-products', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // SQL query to fetch the highest selling products within the date range
    const query = `
      SELECT 
        product_name,
        SUM(quantity_sold) AS total_quantity_sold
      FROM sales_data
      WHERE date::DATE BETWEEN $1 AND $2
      GROUP BY product_name
      ORDER BY total_quantity_sold DESC;
    `;

    // Execute the query with the provided start and end dates
    const result = await pool.query(query, [startDate, endDate]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No sales data available for the given date range' });
    }

    // Prepare data for visualization
    const data = result.rows.map(row => ({
      product_name: row.product_name,
      quantity_sold: row.total_quantity_sold,
    }));

    return res.json(data);

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Error in fetching product demand: ' + err.message });
  }
});






router.get('/call-feedback-graph', async (req, res) => {
  try {
      // Call the Flask API
      const response = await axios.get('https://lolos-place-backend-1.onrender.com/feedback-graph', null, {
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





router.get('/call-feedback-stats', async (req, res) => {
  try {
      // Call the Flask API
      const response = await axios.get('https://lolos-place-backend-1.onrender.com/feedback-stats');

      // Forward the JSON data received from Flask
      res.json(response.data);
  } catch (error) {
      console.error('Error calling Flask route:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Error fetching feedback stats' });
  }
});







router.post('/api/call-analyze-sentiment', async (req, res) => {
  try {
      // Forward the JSON body to the Flask API with correct headers
      const response = await axios.post('https://lolos-place-backend-1.onrender.com/api/analyze-sentiment', req.body, {
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



router.get('/node-test-db', async (req, res) => {
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