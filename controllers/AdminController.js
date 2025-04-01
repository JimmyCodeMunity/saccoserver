const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require("../models/AdminModel");
const User = require('../models/UserModel');
const Staff = require('../models/StaffModel');
const Department = require('../models/DepartmentModel');
const nodemailer = require('nodemailer')
const crypto = require("crypto");
const Ticket = require('../models/TicketModel');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({
        path: './.env'
    })
}


const authtoken = process.env.JWT_SECRET;
const emailpass = process.env.EMAIL_PASSWORD;
const verifyemail = process.env.VERIFY_EMAIL;
// console.log("my auth token: " + authtoken);


const generateRandomPassword = (length = 12) => {
    return crypto.randomBytes(length)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
        .slice(0, length); // Trim to required length
};

const sendEmail = async (req, res) => {
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


// emmail
const sendUserCredentials = async (username, email, password, loginUrl) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: true,
            auth: {
                user: verifyemail,
                pass: emailpass,
            },
        });

        // Inject dynamic values into the HTML template
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Karura Sacco</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding: 20px 0;
                    background:rgb(29, 177, 41);
                    color: white;
                    font-size: 24px;
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
                }
                .content {
                    padding: 20px;
                    color: #333;
                    line-height: 1.6;
                }
                .details {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .details p {
                    margin: 5px 0;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    padding: 10px;
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    Welcome to Karura Sacco
                </div>
                <div class="content">
                    <p>Hello <strong>${username}</strong>,</p>
                    <p>Welcome! Your account has been successfully created. Below are your login details:</p>
                    <div class="details">
                        <p>Username: ${username}</p>
                        <p>Email: ${email}</p>
                        <p>Password: ${password}</p>
                    </div>
                    <p>Please keep your credentials safe and do not share them with anyone.</p>
                    <p>Click <a href="${loginUrl}" style="color: #007bff; text-decoration: none;">here</a> to login.</p>
                </div>
                <div class="footer">
                    &copy; 2025 Your Company. All rights reserved.
                </div>
            </div>
        </body>
        </html>`;

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to Karura Sacco',
            html: htmlContent // Use the dynamically generated HTML content
        });

        console.log("Email sent successfully!!", info.messageId);
    } catch (error) {
        console.log("Error sending email", error);
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


// const createUser = async (req, res) => {
//     const { username, email, phone, password } = req.body
//     const loginUrl = "https://karurauserapp.vercel.app/login"
//     try {
//         const existinguser = await User.findOne({ email })
//         if (existinguser) {
//             console.log("User with that email already exists");
//             return res.status(400).json({ message: "User with that email exists" });
//         }
//         else {
//             const hashedPassword = await bcrypt.hash(password.trim(), 10);
//             console.log("Hashed password:", hashedPassword);
//             const user = await User.create({
//                 username: username.trim(),
//                 email: email.trim(),
//                 phone: phone.trim(),
//                 password: hashedPassword,
//             });
//             await sendUserCredentials(username, email, password, loginUrl);
//             console.log("User created successfully:", user);
//             return res.status(201).json({ message: "User created successfully", user });
//         }
//     } catch (error) {
//         console.error("error creating user", error);
//         res.status(500).json({ message: "Error creating user" });

//     }
// }



// create staff


const createUser = async (req, res) => {
    const { username, email, phone } = req.body;
    const loginUrl = "https://karurauserapp.vercel.app/login";

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User with that email already exists");
            return res.status(400).json({ message: "User with that email exists" });
        }

        const password = generateRandomPassword(); // Generate random password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username: username.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: hashedPassword,
        });

        await sendUserCredentials(username, email, password, loginUrl);

        console.log("User created successfully:", user);
        return res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
        console.error("Error creating user", error);
        res.status(500).json({ message: "Error creating user" });
    }
};


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

// get open tickets
const getOpenTickets = async (req, res) => {
    try {
        const ticket = await Ticket.find({status:"Open"})
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');

        // console.log("ticket", ticket)
        return res.status(200).json(ticket)
    } catch (error) {
        console.error("Error getting tickets", error);
        res.status(500).json({ message: "Error getting tickets" });

    }
}
// get closed tickets
const getClosedTickets = async (req, res) => {
    try {
        const ticket = await Ticket.find({status:"Closed"})
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');

        // console.log("ticket", ticket)
        return res.status(200).json(ticket)
    } catch (error) {
        console.error("Error getting tickets", error);
        res.status(500).json({ message: "Error getting tickets" });

    }
}




module.exports = {
    getOpenTickets,
    getClosedTickets,
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