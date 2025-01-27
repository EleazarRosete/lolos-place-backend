const addProduct = `INSERT INTO menu_items (name, description, category, price, items,img, stocks) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING menu_id;`;
const getProduct = "SELECT * FROM menu_items;";
const getProductById = "SELECT * FROM menu_items WHERE menu_id = $1";
const updateProduct = "UPDATE menu_items SET name = $1, description = $2, category = $3, price = $4, items = $5, img = $6, stocks = $7 WHERE menu_id = $8;";
const deleteProduct = "DELETE FROM menu_items WHERE menu_id = $1;"; 
const getCategories = 'SELECT category FROM menu_items';
const getStock = 'SELECT stocks FROM menu_items WHERE menu_id = $1';
const updateStock = `UPDATE menu_items SET stocks = stocks - $1 WHERE menu_id = $2`;

const addOrder = `INSERT INTO orders (user_id, mop, total_amount, date, time, delivery, reservation_id, order_type, customer_name, number_of_people, ispaid ) VALUES (14, $1, $2, CURRENT_DATE, CURRENT_TIME, $3, $4, $5,$6,$7,$8) RETURNING order_id;`;
const getOrder = 'SELECT * FROM orders;';

const addReservation = `INSERT INTO reservations (user_id, guest_number, reservation_date, reservation_time, advance_order) VALUES (13, $1, $2, $3, $4) RETURNING reservation_id;`;
const getReservation = `SELECT 
    r.reservation_id,
    u.first_name,
    u.last_name,
    r.guest_number,
    r.reservation_date,
    r.reservation_time
FROM 
    reservations r
JOIN 
    users u
ON 
    r.user_id = u.user_id;
`;
const cancelReservation = `DELETE FROM reservations WHERE reservation_id = $1 RETURNING *`;


const addDelivery =`INSERT INTO deliveries (order_id, delivery_location, delivery_status) VALUES ($1, $2, $3) RETURNING delivery_id;`;
const getDelivery = 'SELECT * FROM deliveries;';
const getDeliveryByID = 'SELECT * FROM deliveries WHERE order_id = $1;';

const getPayment = `SELECT * FROM payment;`;


const updateDeliveryStatus = `UPDATE deliveries SET delivery_status = 'Delivered' WHERE delivery_id = $1 RETURNING *;`;



const getUsers = `SELECT * FROM users;`;

const orderServed = `UPDATE orders
SET status = 'served'
WHERE order_id = $1;
`;

const getTempData = `SELECT * FROM temp_data;`;



module.exports = {
    addProduct,
    getProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    updateStock,
    getCategories,
    getStock,
    addOrder,
    getOrder,
    addReservation,
    getReservation,
    addDelivery,
    getDelivery,
    getDeliveryByID,
    getPayment,
    updateDeliveryStatus,
    cancelReservation,
    getUsers,
    orderServed,
    getTempData,
};
