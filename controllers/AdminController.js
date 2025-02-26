const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require("../models/AdminModel");
const User = require('../models/UserModel');
const Staff = require('../models/StaffModel');
const Department = require('../models/DepartmentModel');
const nodemailer = require('nodemailer')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({
        path: './.env'
    })
}


const authtoken = process.env.JWT_SECRET;
const emailpass = process.env.EMAIL_PASSWORD;
const verifyemail = process.env.VERIFY_EMAIL;
// console.log("my auth token: " + authtoken);

const sendEmail = async (req,res) => {
    const { to, subject, message } = req.body;

    if (!to || to.length === 0) {
        return res.status(400).json({ error: "No recipients provided." });
    }

    try {
        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail", // Use your email service provider
            port: 587,
            secure: true,
            auth: {
                user: verifyemail, // Your email
                pass: emailpass, // Your email password or app password
            },
        });

        // Convert email array into a string (comma-separated)
        const recipients = to.join(",");

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipients, // Send to multiple recipients
            subject: subject,
            text: message,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log("Emails sent: ", info.response);
        res.status(200).json({ success: true, message: "Emails sent successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
};


const createAdmin = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if all fields are present
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Ensure password is a string before hashing
        if (typeof password !== "string") {
            return res.status(400).json({ message: "Invalid password format" });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log("Admin with that email already exists");
            return res.status(400).json({ message: "User with that email exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        console.log("Hashed password:", hashedPassword);

        // Create admin (Ensure return doesn't break execution)
        const admin = await Admin.create({
            username: username.trim(),
            email: email.trim(),
            password: hashedPassword,
        });

        console.log("Admin created successfully:", admin);
        return res.status(201).json({ message: "Admin created successfully", admin });

    } catch (error) {
        console.error("Error creating admin account:", error);
        return res.status(500).json({ message: "Error creating admin account" });
    }
};


const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingAdmin = await Admin.findOne({ email })
        if (!existingAdmin) {
            return res.status(401).json({ message: "Admin not found" })
        }
        else {
            const isMatch = await bcrypt.compare(password, existingAdmin.password)
            if (!isMatch) {
                console.log("incorret password")
                return res.status(401).json({ message: "Incorrect password" })
            }
            else {
                const token = await jwt.sign({ email: existingAdmin.email }, authtoken);
                console.log("admin logged in")

                return res.json({ status: "success", token })
            }
        }

    } catch (error) {

    }
}


const getAdminData = async (req, res) => {
    const { token } = req.body;
    try {
        if (!token) {
            console.log("no token provided");
            return res.status(401).json({ msg: "No token provided" });
        } else {
            const admin = await jwt.verify(token, authtoken);
            const adminemail = admin.email
            console.log("adminemail: ", adminemail)
            const data = await Admin.findOne({ email: adminemail });
            return res.status(200).json(data);
        }

    } catch (error) {
        console.error("error getting user data ", error);
        res.status(500).json(error);

    }
}


const createUser = async (req, res) => {
    const { username, email, phone, password } = req.body
    try {
        const existinguser = await User.findOne({ email })
        if (existinguser) {
            console.log("User with that email already exists");
            return res.status(400).json({ message: "User with that email exists" });
        }
        else {
            const hashedPassword = await bcrypt.hash(password.trim(), 10);
            console.log("Hashed password:", hashedPassword);
            const user = await User.create({
                username: username.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password: hashedPassword,
            });
            console.log("User created successfully:", user);
            return res.status(201).json({ message: "User created successfully", user });
        }
    } catch (error) {
        console.error("error creating user", error);
        res.status(500).json({ message: "Error creating user" });

    }
}



// create staff
const createStaff = async (req, res) => {
    const { username, email, phone, password, departmentid } = req.body;
    console.log("Selected Dept ID:", departmentid);

    try {
        // Check if user already exists
        const existingUser = await Staff.findOne({ email });
        if (existingUser) {
            console.log("Staff with that email already exists");
            return res.status(400).json({ message: "User with that email exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        console.log("Hashed password:", hashedPassword);

        // Create staff member
        const user = await Staff.create({
            username: username.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: hashedPassword,
            departmentid
        });

        // Find and update the department
        const department = await Department.findById(departmentid);
        if (!department) {
            console.log("Department not found");
            return res.status(404).json({ message: "Department not found" });
        }
        department.depthead = user?._id;
        department.assignedStatus = true;
        await department.save();
        console.log("Updated Department:", department);

        console.log("Staff created successfully:", user);
        return res.status(201).json({ message: "Staff created successfully", user });

    } catch (error) {
        console.error("Error creating user", error);
        res.status(500).json({ message: "Error creating user" });
    }
};




// get all users
const getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        console.log("users", users)
        return res.status(200).json(users)

    } catch (error) {
        console.log("error getting users", error)
        return res.status(500).json({ message: "error fetching users" })

    }
}




// get all staff
// const getStaff = async (req, res) => {
//     try {
//         const users = await Staff.find({});
//         console.log("staff", users)
//         return res.status(200).json(users)

//     } catch (error) {
//         console.log("error getting staff", error)
//         return res.status(500).json({ message: "error fetching staff" })

//     }
// }

const getStaff = async (req, res) => {
    try {
        const staff = await Staff.find({})
            .populate('departmentid', 'deptname depthead assignedStatus'); // Populating department details

        console.log("Staff:", staff);
        return res.status(200).json(staff);

    } catch (error) {
        console.error("Error getting staff", error);
        return res.status(500).json({ message: "Error fetching staff" });
    }
};



const createDepartment = async (req, res) => {
    const { deptname } = req.body;

    try {
        const existingdept = await Department.findOne({ deptname });
        if (existingdept) {
            console.log("department already exisitng")
            return res.status(400).json({ message: "department already in existence" })
        }
        const dept = await Department.create({ deptname })
        console.log("dept added")
        return res.status(200).json(dept)

    } catch (error) {
        console.log("error creating department", error)
        return res.status(500).json({ message: "error creating department" })

    }
}


// const getDepartments = async (req, res) => {
//     try {
//         const dept = await Department.find({})
//         console.log("departments", dept)
//         return res.status(200).json(dept)

//     } catch (error) {
//         console.log("error getting departments", error)
//         return res.status(500).json({ message: "error fetching departments" })

//     }
// }

const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({})
            .populate('depthead', 'username email phone'); // Populate depthead with selected fields

        console.log("Departments:", departments);
        return res.status(200).json(departments);
    } catch (error) {
        console.error("Error getting departments", error);
        return res.status(500).json({ message: "Error fetching departments" });
    }
};

// get available departments
const getAvailableDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ assignedStatus: false });
        console.log("Available Departments:", departments);
        return res.status(200).json(departments);
    } catch (error) {
        console.error("Error getting available departments", error);
        return res.status(500).json({ message: "Error fetching available departments" });
    }
};

// find staff by id and delete
const deleteStaff = async (req, res) => {
    const { id } = req.params;


    try {
        // Find the staff by ID
        const staff = await Staff.findById(id);
        if (!staff) {
            console.log("Staff not found");
            return res.status(404).json({ message: "Staff not found" });
        }
        console.log("staff id", staff)
        // return

        // Check if the staff is a department head
        if (staff.departmentid) {
            await Department.findOneAndUpdate(
                { _id: staff.departmentid, depthead: id },
                { $set: { depthead: null, assignedStatus: false } }
            );
        }

        // Delete the staff
        await Staff.findByIdAndDelete(id);

        console.log("Staff deleted successfully:", staff);
        return res.status(200).json({ message: "Staff deleted successfully" });
    } catch (error) {
        console.error("Error deleting staff", error);
        return res.status(500).json({ message: "Error deleting staff" });
    }
};


// delete users
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the user by ID
        const user = await User.findById(id);
        if (!user) {
            console.log("User not found");
            return res.status(404).json({ message: "User not found" });
        }

        // Delete the user
        await User.findByIdAndDelete(id);

        console.log("User deleted successfully:", user);
        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user", error);
        return res.status(500).json({ message: "Error deleting user" });
    }
};


// update user
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, phone, password } = req.body;
    console.log("Updating user:", { id, username, email, phone, password });
    // return

    // find by id and update
    try {
        const user = await User.findByIdAndUpdate(id, { username, email, phone }, { new: true });
        if (!user) {
            console.log("User not found");
            return res.status(404).json({ message: "User not found" });
        }

        // Hash password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password.trim(), 10);
            user.password = hashedPassword;
        }

        await user.save();
        console.log("User updated successfully:", user);
        return res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Error updating user", error);
        return res.status(500).json({ message: "Error updating user" });
    }
}




module.exports = {
    createAdmin,
    adminLogin,
    getAdminData,
    createUser,
    createStaff,
    getUsers,
    getStaff,
    createDepartment,
    getDepartments,
    getAvailableDepartments,
    deleteStaff,
    deleteUser,
    updateUser,
    sendEmail
}