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
// Insert faculty into the faculty table
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
  
  // Get faculty by insert ID
  async function getFacultyByInsertId(insertId) {
    const query = `SELECT * FROM faculty WHERE fid = ?`;
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
  
  // Get faculty by email and password
  async function getFacultyByEmailAndPassword(email, password) {
    return new Promise((resolve, reject) => {
      const selectQuery = `SELECT * FROM faculty WHERE email = ? AND password = ?`;
      connection.query(selectQuery, [email, password], (err, results) => {
        if (err) {
          console.error("Error fetching faculty: " + err.stack);
          return reject(err);
        }
        resolve(results[0]);
      });
    });
  }
  
  // Update faculty by insert ID
  async function updateFacultyByInsertId(
    insertId,
    name,
    email,
    password,
    department,
    phone_number
  ) {
    const query = `UPDATE faculty SET name = ?, email = ?, password = ?, department = ?, phone_number = ? WHERE fid = ?`;
    const values = [name, email, password, department, phone_number, insertId];
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
  
  // Delete faculty by insert ID
  async function deleteFacultyByInsertId(insertId) {
    const query = `DELETE FROM faculty WHERE fid = ?`;
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
  
  // Get all faculty
  async function getAllFaculty() {
    const query = `SELECT * FROM faculty`;
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
  
  // Mark faculty attendance
  async function markFacultiesAttendance(
    presentFacultyIds,
    absentFacultyIds,
    onLeaveFacultyIds
  ) {
    try {
      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split("T")[0];
  
      // Iterate over presentFacultyIds and mark their attendance
      const presentAttendancePromises = presentFacultyIds.map(async (facultyId) => {
        // Insert an attendance record for the current date and mark faculty as present
        await insertAttendance(facultyId, currentDate, "present");
      });
  
      // Iterate over absentFacultyIds and mark their attendance
      const absentAttendancePromises = absentFacultyIds.map(async (facultyId) => {
        // Insert an attendance record for the current date and mark faculty as absent
        await insertAttendance(facultyId, currentDate, "absent");
      });
  
      // Iterate over onLeaveFacultyIds and mark their attendance
      const onLeaveAttendancePromises = onLeaveFacultyIds.map(async (facultyId) => {
        // Insert an attendance record for the current date and mark faculty as on leave
        await insertAttendance(facultyId, currentDate, "on leave");
      });
  
      // Wait for all attendance records to be inserted
      await Promise.all([
        ...presentAttendancePromises,
        ...absentAttendancePromises,
        ...onLeaveAttendancePromises,
      ]);
  
      console.log("Attendance marked for all faculty members.");
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  }
  
  // Function to insert attendance record
  async function insertAttendance(facultyId, date, status) {
    const query = `INSERT INTO faculty_attendance (fid, date, status) VALUES (?, ?, ?)`;
    const values = [facultyId, date, status];
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
  
  // Get faculty status
  function getFacultyStatus(facultyId) {
    return new Promise((resolve, reject) => {
      // Query to get total working days for the faculty
      const totalDaysQuery = `SELECT COUNT(*) as totalDays FROM faculty_attendance WHERE fid = ?`;
      connection.query(
        totalDaysQuery,
        [facultyId],
        (totalDaysErr, totalDaysResult) => {
          if (totalDaysErr) {
            console.error("Error fetching total working days:", totalDaysErr);
            return reject(totalDaysErr);
          }
          const totalDays = totalDaysResult[0].totalDays;
  
          // Query to get the number of days faculty was present
          const presentDaysQuery = `SELECT COUNT(*) as presentDays FROM faculty_attendance WHERE fid = ? AND status = 'present'`;
          connection.query(
            presentDaysQuery,
            [facultyId],
            (presentDaysErr, presentDaysResult) => {
              if (presentDaysErr) {
                console.error("Error fetching present days:", presentDaysErr);
                return reject(presentDaysErr);
              }
              const presentDays = presentDaysResult[0].presentDays;
  
              // Query to get the number of days faculty was absent
              const absentDaysQuery = `SELECT COUNT(*) as absentDays FROM faculty_attendance WHERE fid = ? AND status = 'absent'`;
              connection.query(
                absentDaysQuery,
                [facultyId],
                (absentDaysErr, absentDaysResult) => {
                  if (absentDaysErr) {
                    console.error("Error fetching absent days:", absentDaysErr);
                    return reject(absentDaysErr);
                  }
                  const absentDays = absentDaysResult[0].absentDays;
  
                  // Query to get the number of days faculty was on leave
                  const onLeaveDaysQuery = `SELECT COUNT(*) as onLeaveDays FROM faculty_attendance WHERE fid = ? AND status = 'on leave'`;
                  connection.query(
                    onLeaveDaysQuery,
                    [facultyId],
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
  async function getFacultyCourses(fid){
    const query = `
        Select course_id,course_name from courses where course_id in (select course_id from teaches where fid = 1)`
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
  
 // Insert faculty leave
async function insertFacultyLeave(fid, from_date, to_date, Description) {
  const query = `INSERT INTO faculty_on_leave (faculty_id, from_date, to_date, Description) VALUES (?, ?, ?, ?)`;
  const values = [fid, from_date, to_date, Description];
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

// Get all faculty leave
async function getAllFacultyLeave() {
  const query = `SELECT name, from_date, to_date, Description, status, faculty_id
  FROM faculty_on_leave AS fl LEFT JOIN faculty as f  
  on f.fid = fl.faculty_id`;
  return new Promise((resolve, reject) => {
    connection.query(query, [], (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

// Action faculty leave
async function actionFacultyLeave(fid, from_date, to_date, status) {
  const query = `UPDATE faculty_on_leave SET status = ? WHERE faculty_id = ? AND from_date = ? AND to_date = ?`;
  const values = [status, fid, from_date, to_date];
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

// Get all faculty on leave
async function getAllFacultyOnLeave(date) {
  const query = `SELECT fl.faculty_id, f.name, fl.from_date, fl.to_date, fl.Description, fl.status
                 FROM faculty_on_leave AS fl
                 INNER JOIN faculty AS f ON fl.faculty_id = f.fid
                 WHERE fl.status = 'approved' AND DATE('${date}') BETWEEN fl.from_date AND fl.to_date`;
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

// get attendance of faculty by faculty id for this month
async function getFacultyAttendance(fid) {
  const query = `SELECT COUNT(*) as totalDays FROM faculty_attendance WHERE fid = ? AND MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE())`;
  try {
    const results = await new Promise((resolve, reject) => {
      connection.query(query, [fid], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]);
        }
      });
    });
    return results;
  }catch (error) {
    throw error;
  }
}

// get total no of faculty
async function getTotalFaculty() {
  const query = `SELECT COUNT(*) as totalFaculty FROM faculty`;
  try {
    const results = await new Promise((resolve, reject) => {
      connection.query(query, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]);
        }
      });
    });
    return results;
  }catch (error) {
    throw error;
  }
}

// get total no of leaves taken by faculty
async function getTotalFacultyLeave(fid) {
  const query = `SELECT faculty_id, COUNT(*) as count FROM faculty_on_leave WHERE faculty_id = ? AND status = 'approved' GROUP BY faculty_id`;
  try {
    const results = await new Promise((resolve, reject) => {
      connection.query(query, [fid], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]);
        }
      });
    });
    return results;
  }catch (error) {
    throw error;
  }
}
async function archiveAndDeleteFaculty(fid) {
  try {
    await new Promise((resolve, reject) => {
      connection.query("INSERT INTO archived_faculty SELECT * FROM faculty WHERE fid = ?", [fid], function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    await new Promise((resolve, reject) => {
      connection.query("INSERT INTO archived_faculty_attendance SELECT * FROM faculty_attendance WHERE fid = ?", [fid], function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    await new Promise((resolve, reject) => {
      connection.query("INSERT INTO archived_faculty_on_leave SELECT * FROM faculty_on_leave WHERE faculty_id = ?", [fid], function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    await new Promise((resolve, reject) => {
      connection.query("DELETE FROM faculty_attendance WHERE fid = ?", [fid], function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    await new Promise((resolve, reject) => {
      connection.query("DELETE FROM faculty_on_leave WHERE faculty_id = ?", [fid], function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    await new Promise((resolve, reject) => {
      connection.query("DELETE FROM faculty WHERE fid = ?", [fid], function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    console.log('Faculty member and their attendance records deleted successfully');
  } catch (error) {
    console.error(error);
  }
}
async function getApprovedLeavesForFaculty(facultyId) {
  const query = `SELECT * FROM faculty_on_leave WHERE faculty_id = ? AND status = 'approved'`;
  try {
    const results = await new Promise((resolve, reject) => {
      connection.query(query, [facultyId], (error, results) => {
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
  updateFacultyByInsertId,
  deleteFacultyByInsertId,
  getAllFaculty,
  markFacultiesAttendance,
  getFacultyStatus,
  getFacultyCourses,
  insertFacultyLeave,
  getAllFacultyLeave,
  actionFacultyLeave,
  getAllFacultyOnLeave,
  getFacultyAttendance,
  getTotalFaculty,
  getTotalFacultyLeave,
  archiveAndDeleteFaculty,
  getApprovedLeavesForFaculty
};