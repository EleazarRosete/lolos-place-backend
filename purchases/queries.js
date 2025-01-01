const getPurchases = `SELECT * FROM purchases;`;
const addPurchases = `INSERT INTO purchases (ordertype, amount, orders, name)
VALUES ($1, $2, $3, $4)`;

module.exports = {
    getPurchases,
    addPurchases,
};
