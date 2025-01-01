const addSales = `INSERT INTO sales_data (date, amount, service_charge, gross_sales, product_name, category, quantity_sold, price_per_unit, mode_of_payment, order_type) VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, $8, $9);`;
const getSales = "SELECT * FROM sales_data;";
const getBestProducts = `
WITH product_sales AS (
    SELECT
        product_name,
        SUM(quantity_sold) AS total_quantity_sold
    FROM sales_data
    GROUP BY product_name
),
ranked_sales AS (
    SELECT
        product_name,
        total_quantity_sold,
        RANK() OVER (ORDER BY total_quantity_sold DESC) AS rank_desc
    FROM product_sales
)
SELECT
    product_name
FROM ranked_sales
WHERE rank_desc <= 5;
`;



module.exports = {
    addSales,
    getSales,
    getBestProducts,
};
