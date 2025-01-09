const pool = require('../db');
const queries = require('./queries');
const axios = require('axios'); // Import axios

const PAYMONGO_SECRET_KEY = 'sk_test_Uarb4zRpXZb9PXmTHeK1ZTEp'; // Replace with your PayMongo secret key

const generateRandomId = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
};

const getPayment = async (req, res) => {
    try {
        const { rows } = await pool.query(queries.getPayment);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No payments found' });
        }
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ error: 'Error fetching payment' });
    }
};


const addPayment = async (req, res) => {
    const { user_id, lineItems } = req.body;

    const formattedLineItems = lineItems.map((product) => ({
        currency: 'PHP',
        amount: Math.round(product.price * 100), // Convert to cents
        name: product.name,
        quantity: product.quantity,
    }));

    const randomId = generateRandomId(28);

    try {
        const response = await axios.post(
            'https://api.paymongo.com/v1/checkout_sessions',
            {
                data: {
                    attributes: {
                        send_email_receipt: false,
                        show_line_items: true,
                        line_items: formattedLineItems,
                        payment_method_types: ['gcash'],
                        success_url: `http://localhost:5173/successpage?session_id=${randomId}`,
                        cancel_url: 'http://localhost:5173/',
                    },
                },
            },
            {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString('base64')}`, // Encode secret key
                },
            }
        );

        const checkoutUrl = response.data.data.attributes.checkout_url;

        if (!checkoutUrl) {
            return res.status(500).json({ error: 'Checkout URL not found in response' });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            const values = [user_id, randomId, 'pending'];
            await client.query(queries.addPayment, values);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error inserting/updating payment:', error.message);
            return res.status(500).json({ error: 'Failed to insert/update payment', details: error.message });
        } finally {
            client.release();
        }

        res.status(200).json({ url: checkoutUrl });
    } catch (error) {
        console.error('Error creating checkout session:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to create checkout session', details: error.response ? error.response.data : error.message });
    }
};

module.exports = {
    getPayment,
    addPayment,
};
