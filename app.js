const express = require("express");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const session = require('express-session');
const path = require("path");
const bodyParser = require("body-parser");


const app = express();
app.use(express.json());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
const { insertFaculty, getFacultyByEmailAndPassword, getFacultyByInsertId, updateFaculty, deleteFaculty,getFacultyCourses } = require("./database_query/faculty");
const { insertStaff, getStaffByEmailAndPassword, getStaffByInsertId, getAllStaff } = require("./database_query/staff");


app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.get("/", (req, res) => {
    res.render("loginAs");
});
app.get("/login", (req, res) => {
    res.render("loginAs");
});
app.get("/register", (req, res) => {
    res.render("registerAs");
});
//----------------------Staff----------------------
function isValidateStaff(req, res, next) {
    if (req.session.StaffId) {
        next();
    } else {
        res.redirect("/login");
    }
}
//-----------------StaffRegisteration---------------------
app.post("/staffRegister", async (req, res) => {
    const { name, email, password, phone_number, designation } = req.body;
    console.log(req.body)
    try {
        //Insert into staff table
        const result = await insertStaff(name, email, password, designation, phone_number);
        req.session.StaffId = result.sid;
        res.redirect(`/staffdashboard/${result.sid}`);

    } catch (error) {
        console.error("Error inserting staff:", error);
        res.status(500).json({ success: false, message: "Error inserting staff", error: error.message });
    }
});
//-----------------StaffLogin---------------------
app.post("/staffLogin", async (req, res) => {
    const { email, password } = req.body;

    try {
        const staff = await getStaffByEmailAndPassword(email, password);
        if (staff) {
            req.session.StaffId = staff.sid;
            res.redirect(`/staffdashboard/${staff.sid}`);
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error logging in staff:", error);
        res.status(500).json({ success: false, message: "Error logging in staff", error: error.message });
    }
});
//-----------------StaffDashboard---------------------
app.get("/staffdashboard/:sid", isValidateStaff, async (req, res) => {
    const sid = req.params.sid;

    try {
        const staff = await getStaffByInsertId(sid);
        if (!staff) {
            res.redirect("/login");
            return;
        }
        res.render("Staff/dashboard/dashboard", { staff });
    } catch (error) {
        console.error("Error fetching staff details:", error);
        res.status(500).json({ success: false, message: "Error fetching staff details", error: error.message });
    }
});
app.get("/staffdashboard/:sid/profile", isValidateStaff, async (req, res) => {
    const sid = req.params.sid;

    try {
        const staff = await getStaffByInsertId(sid);
        if (!staff) {
            res.redirect("/login");
            return;
        }
        res.render("Staff/profile/info", { staff });
    } catch (error) {
        console.error("Error fetching staff details:", error);
        res.status(500).json({ success: false, message: "Error fetching staff details", error: error.message });
    }
}
);
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/login');
    });
});

//--------------------------Faculty--------------------------
function isValidateFaculty(req, res, next) {
    if (req.session.FacultyId) {
        next();
    } else {
         res.redirect("/login");
        
    }
}
//-----------------FacultyRegisteration---------------------
app.post("/facultyRegister", async (req, res) => {
    const { name, email, password, phone_number, department } = req.body;
    try {
        //Insert into faculty table
        const result = await insertFaculty(name, email, password, department, phone_number);
        req.session.FacultyId = result.fid;
        res.redirect(`/facultydashboard/${result.fid}`);

    } catch (error) {
        console.error("Error inserting faculty:", error);
        res.status(500).json({ success: false, message: "Error inserting faculty", error: error.message });


    }
});
//-----------------FacultyLogin---------------------
app.post("/facultyLogin", async (req, res) => {
    const { email, password } = req.body;

    try {
        const fac = await getFacultyByEmailAndPassword(email, password);
        console.log(fac);
        if (fac) {
            req.session.FacultyId = fac.fid;
            res.redirect(`/facultydashboard/${fac.fid}`);
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error logging in faculty:", error);
        res.status(500).json({ success: false, message: "Error logging in faculty", error: error.message });
    }
});
//-----------------FacultyDashboard---------------------
app.get("/facultydashboard/:fid", isValidateFaculty, async (req, res) => {
    const fid = req.params.fid;

    try {
        const faculty = await getFacultyByInsertId(fid);
        const courses = await getFacultyCourses(fid);
        if (!faculty) {
            res.redirect("/login");
            return;
        }
        res.render("Faculty/dashboard/dashboard", { faculty, courses});
    } catch (error) {
        console.error("Error fetching faculty details:", error);
        res.status(500).json({ success: false, message: "Error fetching faculty details", error: error.message });
    }
});
app.get("/facultydashboard/:fid/profile", isValidateFaculty, async (req, res) => {
    const fid = req.params.fid;

    try {
        const faculty = await getFacultyByInsertId(fid);
        if (!faculty) {
            res.redirect("/login");
            return;
        }
        res.render("Faculty/profile/info", { faculty });
    } catch (error) {
        console.error("Error fetching faculty details:", error);
        res.status(500).json({ success: false, message: "Error fetching faculty details", error: error.message });
    }
}
);
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/login');
    });
});

app.get("/notice", (req, res) => {
    res.render("faculty/notice/notification");
});

// -------- Admin --------//
app.get("/admin", (req, res) => {
    res.render("Admin/login")
})

app.post("/admin", (req, res) => {
    const {email, password} = req.body;
    if(email === 'admin@iiitg.ac.in' && password === 'admin@123') {
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('admin');
    }
})

app.get('/admin/dashboard',(req, res) => {
    res.render('Admin/home');
})

app.get('/admin/staff/view', async (req, res) => {
    const staffs = await getAllStaff();
    res.render('Admin/staff/index',{staffs: staffs});
})

app.get("/admin/staff/attendance",async (req, res) => {
    const staffs = await getAllStaff();
    res.render('Admin/staff/attendance',{staffs: staffs});
})

app.post("/admin/staff/attendance",async (req, res) => {
    const attendanceData = req.body.attendance;
    
})

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
