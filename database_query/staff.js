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

//Insert data into staff table 
async function insertStaff(name,email,password,designation,phone_number){
    const query = `INSERT INTO staff (name,email,password,designation,phone_number) VALUES (?,?,?,?,?)`;
    const values = [name,email,password,designation,phone_number];
    return new Promise((resolve,reject)=>{
        connection.query(query,values,(err,results)=>{
            if(err){
                reject(err);
                return;
            }
            resolve({sid:results.insertId});
        });
    });

}

//Get staff by insert ID
async function getStaffByInsertId(insertId){
    const query = `SELECT * FROM staff WHERE sid = ?`;
    try{
        const results = await new Promise((resolve,reject)=>{
            connection.query(query,[insertId],(error,results)=>{
                if(error){
                    reject(error);
                }else{
                    resolve(results[0]);
                }
            });
        });
        return results;
    }
    catch(error){
        throw error;
    }
}

//Get staff by email and password
async function getStaffByEmailAndPassword(email,password){
    return new Promise((resolve,reject)=>{
        const selectQuery = `SELECT * FROM staff WHERE email = ? AND password = ?`;
        connection.query(selectQuery,[email,password],(err,results)=>{
            if(err){
                console.error("Error fetching staff: "+err.stack);
                return reject(err);
            }
            resolve(results[0]);
        });
    });
}

//Update faculty by insert ID
async function updateStaffByInsertId(insertId,name,email,password,designation,phone_number){
    const query = `UPDATE staff SET name = ?, email = ?, password = ?, designation = ?, phone_number = ? WHERE sid = ?`;
    const values = [name,email,password,designation,phone_number,insertId];
    return new Promise((resolve,reject)=>{
        connection.query(query,values,(err,results)=>{
            if(err){
                reject(err);
                return;
            }
            resolve({sid:results.insertId});
        });
    });
}

//Delete staff by insert ID
async function deleteStaffByInsertId(insertId){
    const query = `DELETE FROM staff WHERE sid = ?`;
    return new Promise((resolve,reject)=>{ 
        connection.query(query,[insertId],(err,results)=>{
            if(err){
                reject(err);
                return;
            }
            resolve(results);
        });
    });
}

async function getAllStaff(){
    const query = `SELECT * FROM staff`;
    try{
        const results = await new Promise((resolve,reject)=>{
            connection.query(query,[],(error,results)=>{
                if(error){
                    reject(error);
                }else{
                    resolve(results);
                }
            });
        });
        return results;
    }
    catch(error){
        throw error;
    }
}


 module.exports = {
    insertStaff,
    getStaffByInsertId,
    getStaffByEmailAndPassword,
    updateStaffByInsertId,
    deleteStaffByInsertId,
    getAllStaff
};