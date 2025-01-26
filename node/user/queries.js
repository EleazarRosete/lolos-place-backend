const updateUser = `UPDATE users 
            SET 
                address = $1,
                email = $2,
                first_name = $3,
                last_name = $4,
                password = $5,
                phone = $6
            WHERE user_id = $7
            RETURNING *;`;
const getUser = "SELECT * FROM users WHERE user_id = $1";
const updateUserWithPassword = `UPDATE users 
SET address = $1, email = $2, first_name = $3, last_name = $4, password = $5, phone = $6 
WHERE user_id = $7 
RETURNING *;
`;
const updateUserWithoutPassword = `UPDATE users 
SET address = $1, email = $2, first_name = $3, last_name = $4, phone = $5 
WHERE user_id = $6 
RETURNING *;
`;


module.exports = {
    getUser,
    updateUser,
    updateUserWithPassword,

};
