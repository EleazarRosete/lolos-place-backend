require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL, // Use environment variable for security
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect()
  .then(() => console.log('Connected to the database'))
  .catch((err) => console.error('Database connection error', err.stack));


const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || '', // Use DATABASE_URL for production
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, // SSL only for production
    user: process.env.DB_USER || 'postgres', // Fallback for local development
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'lolos-place',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432, // Default PostgreSQL port
});

module.exports = pool;

// require('dotenv').config();


// const { Pool } = require('pg');

// const pool = new Pool({

//     user: process.env.DB_USER || 'postgres', // Fallback for local development
//     host: process.env.DB_HOST || 'localhost',
//     database: process.env.DB_DATABASE || 'lolos-place',
//     password: process.env.DB_PASSWORD || 'password',
//     port: process.env.DB_PORT || 5432, // Default PostgreSQL port
// });

// module.exports = pool;

