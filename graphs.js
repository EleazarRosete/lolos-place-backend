const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
const router = express.Router();


const pythonBackendUrl = 'http://127.0.0.1:5000/peak-hours-data/peak-hours-data';

// POST route to call the peak-hours-data route in the Python backend
router.get('/get-peak-hours', async (req, res) => {
  try {
    // Making a request to the Python backend
    const response = await axios.get(pythonBackendUrl);
    
    // Sending the data received from Python backend to the frontend
    res.json(response.data);
  } catch (error) {
    console.error('Error calling Python backend:', error);
    res.status(500).json({ error: 'Error retrieving peak hours data from backend' });
  }
});

app.get('/get-product-demand', async (req, res) => {
  const { year, month } = req.query;  // Get year and month from query parameters

  try {
    // Make a GET request to the Flask API with query parameters (year and month)
    const response = await axios.get('https://lolos-place-backend.onrender.com/graphs/get-product-demand', {
      params: { year, month }  // Pass the year and month as query parameters
    });

    // Return the response data from Flask API to the frontend
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data from Flask API:", error);
    res.status(500).json({ error: "Error fetching product demand" });
  }
});




router.post('/get-sales-forecast');
router.post('/get-customer-reviews');



// Mounting the router on the main app
app.use(router);

module.exports = router;