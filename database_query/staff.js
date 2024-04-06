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
async function insertStaff(name, email, password, designation, phone_number) {
  const query = `INSERT INTO staff (name,email,password,designation,phone_number) VALUES (?,?,?,?,?)`;
  const values = [name, email, password, designation, phone_number];
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ sid: results.insertId });
    });
  });
}

//Get staff by insert ID
async function getStaffByInsertId(insertId) {
  const query = `SELECT * FROM staff WHERE sid = ?`;
  try {
    const results = await new Promise((resolve, reject) => {
      connection.query(query, [insertId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]);
        }
      });
    });
    return results;
  } catch (error) {
    throw error;
  }
}

//Get staff by email and password
async function getStaffByEmailAndPassword(email, password) {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM staff WHERE email = ? AND password = ?`;
    connection.query(selectQuery, [email, password], (err, results) => {
      if (err) {
        console.error("Error fetching staff: " + err.stack);
        return reject(err);
      }
      resolve(results[0]);
    });
  });
}

//Update faculty by insert ID
async function updateStaffByInsertId(
  insertId,
  name,
  email,
  password,
  designation,
  phone_number
) {
  const query = `UPDATE staff SET name = ?, email = ?, password = ?, designation = ?, phone_number = ? WHERE sid = ?`;
  const values = [name, email, password, designation, phone_number, insertId];
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ sid: results.insertId });
    });
  });
}

//Delete staff by insert ID
async function deleteStaffByInsertId(insertId) {
  const query = `DELETE FROM staff WHERE sid = ?`;
  return new Promise((resolve, reject) => {
    connection.query(query, [insertId], (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

async function getAllStaff() {
  const query = `SELECT * FROM staff`;
  try {
    const results = await new Promise((resolve, reject) => {
      connection.query(query, [], (error, results) => {
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

async function markStaffsAttendance(
  presentStaffIds,
  absentStaffIds,
  onLeaveStaffIds
) {
  try {
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];

    // Iterate over presentStaffIds and mark their attendance
    const presentAttendancePromises = presentStaffIds.map(async (staffId) => {
      // Insert an attendance record for the current date and mark staff as present
      await insertAttendance(staffId, currentDate, "present");
    });

    // Iterate over absentStaffIds and mark their attendance
    const absentAttendancePromises = absentStaffIds.map(async (staffId) => {
      // Insert an attendance record for the current date and mark staff as absent
      await insertAttendance(staffId, currentDate, "absent");
    });

    // Iterate over onLeaveStaffIds and mark their attendance
    const onLeaveAttendancePromises = onLeaveStaffIds.map(async (staffId) => {
      // Insert an attendance record for the current date and mark staff as on leave
      await insertAttendance(staffId, currentDate, "on leave");
    });

    // Wait for all attendance records to be inserted
    await Promise.all([
      ...presentAttendancePromises,
      ...absentAttendancePromises,
      ...onLeaveAttendancePromises,
    ]);

    console.log("Attendance marked for all staff members.");
  } catch (error) {
    console.error("Error marking attendance:", error);
  }
}

// Function to insert attendance record
async function insertAttendance(staffId, date, status) {
  const query = `INSERT INTO staff_attendance (sid, date, status) VALUES (?, ?, ?)`;
  const values = [staffId, date, status];
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

function getStaffStatus(staffId) {
  return new Promise((resolve, reject) => {
    // Query to get total working days for the staff
    const totalDaysQuery = `SELECT COUNT(*) as totalDays FROM staff_attendance WHERE sid = ?`;
    connection.query(
      totalDaysQuery,
      [staffId],
      (totalDaysErr, totalDaysResult) => {
        if (totalDaysErr) {
          console.error("Error fetching total working days:", totalDaysErr);
          return reject(totalDaysErr);
        }
        const totalDays = totalDaysResult[0].totalDays;

        // Query to get the number of days staff was present
        const presentDaysQuery = `SELECT COUNT(*) as presentDays FROM staff_attendance WHERE sid = ? AND status = 'present'`;
        connection.query(
          presentDaysQuery,
          [staffId],
          (presentDaysErr, presentDaysResult) => {
            if (presentDaysErr) {
              console.error("Error fetching present days:", presentDaysErr);
              return reject(presentDaysErr);
            }
            const presentDays = presentDaysResult[0].presentDays;

            // Query to get the number of days staff was absent
            const absentDaysQuery = `SELECT COUNT(*) as absentDays FROM staff_attendance WHERE sid = ? AND status = 'absent'`;
            connection.query(
              absentDaysQuery,
              [staffId],
              (absentDaysErr, absentDaysResult) => {
                if (absentDaysErr) {
                  console.error("Error fetching absent days:", absentDaysErr);
                  return reject(absentDaysErr);
                }
                const absentDays = absentDaysResult[0].absentDays;

                // Query to get the number of days staff was on leave
                const onLeaveDaysQuery = `SELECT COUNT(*) as onLeaveDays FROM staff_attendance WHERE sid = ? AND status = 'on leave'`;
                connection.query(
                  onLeaveDaysQuery,
                  [staffId],
                  (onLeaveDaysErr, onLeaveDaysResult) => {
                    if (onLeaveDaysErr) {
                      console.error(
                        "Error fetching on leave days:",
                        onLeaveDaysErr
                      );
                      return reject(onLeaveDaysErr);
                    }
                    const onLeaveDays = onLeaveDaysResult[0].onLeaveDays;

                    // Resolve with the results
                    resolve({
                      totalDays,
                      presentDays,
                      absentDays,
                      onLeaveDays,
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
}

async function insertStaffLeave(leaveData) {
  const { staffId, fromDate, toDate, reason } = leaveData;
  const status = "pending"; // Assuming leave requests are initially set as pending

  const query = `INSERT INTO staff_on_leave (staff_id, from_date, to_date, reason, status) VALUES (?, ?, ?, ?, ?)`;
  const values = [staffId, fromDate, toDate, reason, status];

  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results) => {
      if (err) {
        console.error("Error inserting staff leave: ", err);
        reject(err);
        return;
      }
      console.log("Staff leave request inserted successfully");
      resolve(results);
    });
  });
}

async function getAllStaffLeave() {
  const query = `SELECT name, from_date, to_date, reason, status, staff_id
  FROM staff_on_leave AS sl LEFT JOIN staff as s   
  on s.sid = sl.staff_id`;
  try {
    const results = await new Promise((resolve, reject) => {
      connection.query(query, [], (error, results) => {
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

async function actionStaffLeave(staffId, fromDate, toDate, status) {
  // Define the query to update the status of the leave request
  const query = `UPDATE staff_on_leave SET status = ? WHERE staff_id = ? AND from_date = ? AND to_date = ?`;
  const values = [status, staffId, fromDate, toDate];

  try {
    // Execute the query
    const result = await new Promise((resolve, reject) => {
      connection.query(query, values, (error, results) => {
        if (error) {
          reject(error);
        } else {
          console.log(arguments);
          resolve(results);
        }
      });
    });

    return result;
  } catch (error) {
    throw error;
  }
}

async function getAllStaffOnLeave(date) {
  const query = `SELECT sl.staff_id, s.name, sl.from_date, sl.to_date, sl.reason, sl.status
                 FROM staff_on_leave AS sl
                 INNER JOIN staff AS s ON sl.staff_id = s.sid
                 WHERE sl.status = 'approved' AND DATE('${date}') BETWEEN sl.from_date AND sl.to_date`;
  try {
    const results = await new Promise((resolve, reject) => {
      connection.query(query, [], (error, results) => {
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

async function updateStaffAttendance(staffId, date, status) {
  const query = `UPDATE staff_attendance SET status = ? WHERE sid = ? AND date = ?`;
  const values = [status, staffId, date];
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

async function updateStaffsAttendance(
  presentStaffIds,
  absentStaffIds,
  onLeaveStaffIds
) {
  try {
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];

    let presentAttendancePromises = [];
    let absentAttendancePromises = [];
    let onLeaveAttendancePromises = [];

    // Iterate over presentStaffIds and mark their attendance
    if (presentStaffIds) {
      presentAttendancePromises = presentStaffIds.map(async (staffId) => {
        // Update the attendance record for the current date and mark staff as present
        await updateStaffAttendance(staffId, currentDate, "present");
      });
    }

    // Iterate over absentStaffIds and mark their attendance
    if (absentStaffIds) {
      absentAttendancePromises = absentStaffIds.map(async (staffId) => {
        // Update the attendance record for the current date and mark staff as absent
        await updateStaffAttendance(staffId, currentDate, "absent");
      });
    }

    // Iterate over onLeaveStaffIds and mark their attendance
    if (onLeaveStaffIds) {
      onLeaveAttendancePromises = onLeaveStaffIds.map(async (staffId) => {
        // Update the attendance record for the current date and mark staff as on leave
        await updateStaffAttendance(staffId, currentDate, "on leave");
      });
    }

    // Wait for all attendance records to be updated
    await Promise.all([
      ...presentAttendancePromises,
      ...absentAttendancePromises,
      ...onLeaveAttendancePromises,
    ]);

    console.log("Attendance updated for all staff members.");
  } catch (error) {
    console.error("Error updating attendance:", error);
  }
}

module.exports = {
  insertStaff,
  getStaffByInsertId,
  getStaffByEmailAndPassword,
  updateStaffByInsertId,
  deleteStaffByInsertId,
  getAllStaff,
  markStaffsAttendance,
  updateStaffsAttendance,
  getStaffStatus,
  insertStaffLeave,
  getAllStaffLeave,
  actionStaffLeave,
  getAllStaffOnLeave,
};
