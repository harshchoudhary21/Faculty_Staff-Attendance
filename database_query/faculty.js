const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

connection.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL: " + err.stack);
        return;
    }
    console.log("Connected to MySQL as id " + connection.threadId);
});
//Inserting data into faculty table
async function insertFaculty(name, email, password, department, phone_number) {
    const query = `INSERT INTO faculty (name, email, password, department, phone_number) VALUES (?, ?, ?, ?, ?)`;
    const values = [name, email, password, department, phone_number];
    return new Promise((resolve, reject) => {
        connection.query(query, values, (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({ fid: results.insertId });
        });
    });
}
//GET FACULTY BY INSERT ID
async function getFacultyByInsertId(insertId) {
    const query = `
        SELECT * FROM faculty WHERE fid = ?
    `;
    try {
        const results = await new Promise((resolve, reject) => {
            connection.query(query, [insertId], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results[0]); // Assuming there will be only one user with the given insert ID
                }
            });
        });
        return results;
    } catch (error) {
        throw error;
    }
}
//GET FACULTY BY EMAIL and PASSWORD
async function getFacultyByEmailAndPassword(email, password) {
    return new Promise((resolve, reject) => {
        const selectQuery = `SELECT * FROM faculty WHERE email = ? AND password = ?`;
        connection.query(selectQuery, [email, password], (err, results) => {
          if (err) {
            console.error("Error fetching faculty: " + err.stack);
            return reject(err);
          }
          if (results.length === 0) {
            console.error("faculty not found");
            return resolve(null); // Return null when no student is found
          }
          resolve(results[0]);
        });
      });
}

//UPDATE FACULTY BY ID
async function updateFaculty(fid, email, password, name, department, phone_number) {
    const query = `
       UPDATE faculty SET email = ?, password = ?, name = ?, department = ? WHERE faculty_id = ?
    `;
    try {
        const results = await new Promise((resolve, reject) => {
            connection.query(query, [email, password, name, department, fid, phone_number], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
        return getFacultyByInsertId(results.insertId);
    } catch (error) {
        throw error;
    }
}
//DELETE FACULTY BY ID
async function deleteFaculty(fid) {
    const query = `
        DELETE FROM faculty WHERE fid = ?
    `;
    try {
        const results = await new Promise((resolve, reject) => {
            connection.query(query, [fid], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
        return results;
    } catch (error) {
        throw error;
    }
}
async function getFacultyCourses(fid){
    const query = `
        Select course_id,course_name from courses where course_id in (select course_id from teaches where fid = ?)`
    try {
        const results = await new Promise((resolve, reject) => {
            connection.query(query, [fid], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
        return results;
    } catch (error) {
        throw error;
    }
}
module.exports = {
    insertFaculty,
    getFacultyByInsertId,
    getFacultyByEmailAndPassword,
    updateFaculty,
    deleteFaculty,
    getFacultyCourses
};

