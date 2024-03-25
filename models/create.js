const dotenv = require("dotenv");
const mysql = require("mysql");

dotenv.config(); // Load environment variables from .env file

// Create a MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Connect to MySQL server
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + connection.threadId);

  // Create database and tables
  createDatabaseAndTables();
});

// Function to create database and tables
function createDatabaseAndTables() {
  // Create the database if it doesn't exist
  const createDatabaseQuery =
    "CREATE DATABASE IF NOT EXISTS " + process.env.DB_DATABASE;
  executeQuery(
    createDatabaseQuery,
    "Database creation successful",
    "Error creating database"
  );

  // Use the specified database
  const useDatabaseQuery = "USE " + process.env.DB_DATABASE;
  executeQuery(
    useDatabaseQuery,
    "Database selected successfully",
    "Error selecting database"
  );

  // Define the SQL statement to create the faculty table
  const createFacultyTableQuery = `
  CREATE TABLE IF NOT EXISTS faculty (
    fid INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    department VARCHAR(255) NOT NULL
  )
  `;
  executeQuery(
    createFacultyTableQuery,
    "Faculty table created successfully",
    "Error creating Faculty table"
  );

  // Define the SQL statement to create the staff table
  const createStaffTableQuery = `
    CREATE TABLE IF NOT EXISTS staff (
      sid INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      phone_number VARCHAR(15) NOT NULL,
      designation VARCHAR(100) NOT NULL
    )
  `;
  executeQuery(
    createStaffTableQuery,
    "Staff table created successfully",
    "Error creating Staff table"
  );

  // Define the SQL statement to create the faculty attendance  table
  const createFacultyAttendanceTableQuery = `
  CREATE TABLE IF NOT EXISTS faculty_attendance (
    fid INT,
    date DATE,
    status ENUM('present', 'absent', 'on leave') NOT NULL,
    PRIMARY KEY (fid, date),
    FOREIGN KEY (fid) REFERENCES faculty(fid)
  )
`;

  executeQuery(
    createFacultyAttendanceTableQuery,
    "Faculty attendance table created successfully",
    "Error creating Favulty attendance table"
  );

  // Define the SQL statement to create the staff attendance  table
  const createStaffAttendanceTableQuery = `
    CREATE TABLE IF NOT EXISTS staff_attendance (
      sid INT,
      date DATE,
      status ENUM('present', 'absent', 'on leave') NOT NULL,
      PRIMARY KEY (sid, date),
      FOREIGN KEY (sid) REFERENCES staff(sid)
    )
  `;

executeQuery(
    createStaffAttendanceTableQuery,
    "Staff attendance table created successfully",
    "Error creating Staff attendance table"
);

// Define the SQL statement to create the faculty on leave table
const createFacultyOnLeaveTableQuery = `
    CREATE TABLE IF NOT EXISTS faculty_on_leave (
      faculty_id INT,
      from_date DATE,
      to_date DATE,
      Description VARCHAR(255) NOT NULL,
      status ENUM('approved', 'pending', 'rejected') NOT NULL,
      PRIMARY KEY (faculty_id, from_date, to_date),
      FOREIGN KEY (faculty_id) REFERENCES faculty(fid)
    )
  `;

executeQuery(
    createFacultyOnLeaveTableQuery,
    "Faculty on leave table created successfully",
    "Error creating Faculty on leave table"
);

// Define the SQL statement to create the staff on leave table
const createStaffOnLeaveTableQuery = `
    CREATE TABLE IF NOT EXISTS staff_on_leave (
      staff_id INT,
      from_date DATE,
      to_date DATE,
      reason VARCHAR(255) NOT NULL,
      status ENUM('approved', 'pending', 'rejected') NOT NULL,
      PRIMARY KEY (staff_id, from_date, to_date),
      FOREIGN KEY (staff_id) REFERENCES staff(sid)
    )
  `;

executeQuery(
    createStaffOnLeaveTableQuery,
    "Staff on leave table created successfully",
    "Error creating Staff on leave table"
);

const createCoursesTableQuery = `
CREATE TABLE IF NOT EXISTS courses (
  course_id INT PRIMARY KEY,
  course_name VARCHAR(255) NOT NULL,
  Department VARCHAR(255) NOT NULL
)
`;
executeQuery(
  createCoursesTableQuery,
  "Courses table created successfully",
  "Error creating Courses table"
);
const createTeachesTableQuery = `
CREATE TABLE IF NOT EXISTS teaches (
  fid INT,
  course_id INT,
  PRIMARY KEY (fid, course_id),
  FOREIGN KEY (fid) REFERENCES faculty(fid),
  FOREIGN KEY (course_id) REFERENCES courses(course_id)
  )
  `;
executeQuery(
  createTeachesTableQuery,
  "Teaches table created successfully",
  "Error creating Teaches table"
);




  // Close the connection
  connection.end((err) => {
    if (err) {
      console.error("Error closing connection: " + err.stack);
      return;
    }
    console.log("Connection closed");
  });
}

// Function to execute SQL queries
function executeQuery(query, successMessage, errorMessage) {
  connection.query(query, (err, results) => {
    if (err) {
      console.error(errorMessage + ": " + err.stack);
      return;
    }
    console.log(successMessage);
  });
}