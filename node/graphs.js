const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const router = express.Router();
const pool = require('./db'); 


router.get('/test', (req, res) => {
    res.send('tempdata.js route is working!');
  });

  router.get("/peak-hours-data", async (req, res) => {
    try {
        const { start_date, end_date, selected_day } = req.query;

        // Map day names to PostgreSQL's DOW numbering (Monday = 1, Sunday = 7)
        const daysOfWeek = {
            "Monday": 1,
            "Tuesday": 2,
            "Wednesday": 3,
            "Thursday": 4,
            "Friday": 5,
            "Saturday": 6,
            "Sunday": 7
        };

        const dayNumber = daysOfWeek[selected_day];

        if (!dayNumber) {
            return res.status(400).json({ error: "Invalid selected_day. Use Monday-Sunday." });
        }

        const query = `
            WITH hours AS (
                SELECT generate_series(10, 21) AS hour -- Generates numbers from 10 AM to 9 PM
            ),
            hourly_sales AS (
                SELECT 
                    EXTRACT(HOUR FROM o.time::TIME) AS hour,
                    mi.main_category,
                    SUM(oq.order_quantity) AS total_order_quantity
                FROM orders o
                JOIN order_quantities oq ON o.order_id = oq.order_id
                JOIN menu_items mi ON oq.menu_id = mi.menu_id
                WHERE o.date BETWEEN $1 AND $2
                AND EXTRACT(DOW FROM o.date) = $3 -- Use numeric day filtering (Monday = 1, Sunday = 7)
                GROUP BY hour, mi.main_category
            ),
            ranked_sales AS (
                SELECT 
                    h.hour,
                    hs.main_category,
                    COALESCE(hs.total_order_quantity, 0) AS total_order_quantity,
                    RANK() OVER (PARTITION BY h.hour ORDER BY hs.total_order_quantity DESC) AS rnk
                FROM hours h
                LEFT JOIN hourly_sales hs ON h.hour = hs.hour
            )
            SELECT hour, main_category, total_order_quantity
            FROM ranked_sales
            WHERE rnk = 1
            ORDER BY hour;
        `;

        const result = await pool.query(query, [start_date, end_date, dayNumber]);

        // Format output
        const response = result.rows.map(row => ({
            hour: row.hour,
            main_category: row.main_category || "",
            total_order_quantity: row.total_order_quantity || 0
        }));

        res.json(response);
    } catch (error) {
        console.error("Error fetching peak hours data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get('/sales-summary', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
  
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }
  
        const query = `
            SELECT product_name, category, SUM(quantity_sold) AS total_quantity_sold
            FROM sales_data
            WHERE date BETWEEN $1 AND $2
            GROUP BY product_name, category
            ORDER BY total_quantity_sold DESC;
        `;
  
        const { rows } = await pool.query(query, [start_date, end_date]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


router.get('/predict-sales', async (req, res) => {
    try {
        const response = await axios.get('http://127.0.0.1:5000/predict-sales');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales prediction' });
    }
});


router.get('/transactions', async (req, res) => {
  try {
      const result = await pool.query(`
          SELECT 
              EXTRACT(YEAR FROM date::DATE) AS year,
              EXTRACT(MONTH FROM date::DATE) AS month,
              SUM(gross_sales) AS total_sales
          FROM sales_data
          GROUP BY year, month
          ORDER BY year ASC, month ASC
      `);
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.get('/call-feedback-graph', async (req, res) => {
  try {
      // Call the Flask API
      const response = await axios.get('http://127.0.0.1:5000/feedback-graph', null, {
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