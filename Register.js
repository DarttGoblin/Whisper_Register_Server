const mysql = require("mysql");
const express = require("express");
const cors = require("cors");

const app = express();
const port = 7005;

app.use(express.json());
app.use(cors({ origin: "*" }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Create a connection pool
const pool = mysql.createPool({
    connectionLimit: 10, // Maximum number of connections in the pool
    host: 'sql7.freesqldatabase.com',
    user: 'sql7724126',
    password: 'V6PCDXyNdv',
    database: 'sql7724126'
});

app.post("/", (req, res) => {
    const userData = req.body.userData;

    // Get a connection from the pool
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting database connection: ' + err.stack);
            res.status(500).json({ success: false, error: 'Error connecting to the database, ' + err.stack });
            return;
        }
        console.log('Connected to database with connection id ' + connection.threadId);

        const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
        connection.query(checkEmailQuery, [userData.email], (error, emailResults) => {
            if (error) {
                console.log('Error checking email');
                console.error('Error ' + error.stack);
                res.status(500).json({ success: false, error: 'Error checking email' });
                connection.release(); // Release the connection back to the pool
                return;
            }

            if (emailResults.length > 0) {
                console.log('Email already taken');
                res.status(400).json({ success: false, error: 'Email already taken' });
                connection.release(); // Release the connection back to the pool
            } else {
                const checkUsernameQuery = 'SELECT * FROM users WHERE username = ?';
                connection.query(checkUsernameQuery, [userData.username], (error, usernameResults) => {
                    if (error) {
                        console.log('Error checking username');
                        console.error('Error ' + error.stack);
                        res.status(500).json({ success: false, error: 'Error checking username' });
                        connection.release(); // Release the connection back to the pool
                        return;
                    }

                    if (usernameResults.length > 0) {
                        console.log('Username already taken');
                        res.status(400).json({ success: false, error: 'Username already taken' });
                        connection.release(); // Release the connection back to the pool
                    } else {
                        const insertQuery = 'INSERT INTO users(name, email, gender, username, passw) VALUES(?, ?, ?, ?, ?)';
                        connection.query(insertQuery, [userData.name, userData.email, userData.gender, userData.username, userData.password], (error) => {
                            if (error) {
                                console.log("User data hasn't been saved");
                                console.error('Error ' + error.stack);
                                res.status(500).json({ success: false, error: error.stack });
                            } else {
                                console.log('User data has been saved!');
                                res.status(200).json({ success: true });
                            }
                            connection.release(); // Release the connection back to the pool
                        });
                    }
                });
            }
        });
    });
});

app.listen(port, () => console.log("Listening on port " + port));
