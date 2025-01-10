const getPayment = `SELECT * FROM payment;`;
const addPayment = `INSERT INTO payment (user_id, session_id, payment_status) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET session_id = EXCLUDED.session_id, payment_status = EXCLUDED.payment_status;`

module.exports = {
    getPayment,
    addPayment,
};
