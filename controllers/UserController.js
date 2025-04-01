const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require("../models/AdminModel");
const User = require('../models/UserModel');
const Ticket = require('../models/TicketModel');
const nodemailer = require('nodemailer')





if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({
        path: './.env'
    })
}


const authtoken = process.env.JWT_SECRET;
const emailpass = process.env.EMAIL_PASSWORD;
const verifyemail = process.env.VERIFY_EMAIL;




const userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email })
        if (!existingUser) {
            return res.status(401).json({ message: "User not found" })
        }
        else {
            const isMatch = await bcrypt.compare(password, existingUser.password)
            if (!isMatch) {
                console.log("incorret password")
                return res.status(401).json({ message: "Incorrect password" })
            }
            else {
                const token = await jwt.sign({ email: existingUser.email }, authtoken);
                console.log("user logged in")

                return res.json({ status: "success", token })
            }
        }

    } catch (error) {

    }
}


const getUserData = async (req, res) => {
    const { token } = req.body;
    try {
        if (!token) {
            console.log("no token provided");
            return res.status(401).json({ msg: "No token provided" });
        } else {
            const user = await jwt.verify(token, authtoken);
            const useremail = user.email
            // console.log("useremail: ", useremail)
            const data = await User.findOne({ email: useremail });
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

const sendTicketConfirm = async ({username, email, title, description,ticketid}) => {
    console.log("rec",email)
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

        // get current year
        const currentYear = new Date().getFullYear();

        // Inject dynamic values into the HTML template
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your ticket has been submitted</title>
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
                    Ticket Response
                </div>
                <div class="content">
                    <p>Hello <strong>${username}</strong>,</p>
                    <p>Your Ticket has been submitted successfully:</p>
                    <div class="details">
                        <p>Ticket Number: #${ticketid}</p>
                        <p>Title: ${title}</p>
                    </div>
                    <p>We shall email you when your ticket is solved.</p>
                    
                </div>
                <div class="footer">
                    &copy; ${currentYear} Karura Sacco. All rights reserved.
                </div>
            </div>
        </body>
        </html>`;

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Ticket ${ticketid} Submitted`,
            html: htmlContent // Use the dynamically generated HTML content
        });

        console.log("Email sent successfully!!", info.messageId);
    } catch (error) {
        console.log("Error sending email", error);
    }
};

// create a ticket
const createTicket = async (req, res) => {
    const { userid, departmentid, priority, description, title } = req.body;
    console.log(userid, departmentid, priority, description, title)
    // return
    try {
        const ticket = await Ticket.create({
            userid,
            departmentid,
            priority,
            description,
            title,
        })

        // const createdticket = await Ticket.findById(ticket._id)
        const createdticket = await Ticket.findById(ticket._id)
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');
        console.log("ticket saved", ticket)
        console.log("created ticket saved", createdticket)
        sendTicketConfirm({
            username: createdticket?.userid?.username,
            email: createdticket?.userid?.email,
            title,
            description ,
            ticketid:createdticket?._id// replace with actual login URL
        })
        res.status(200).json(ticket)
    } catch (error) {
        console.log("error adding ticket", error)
        res.status(500).json({ message: "error adding ticket" })

    }
}


const getTicketsByUser = async (req, res) => {
    const { userid } = req.params; // Get userid from request parameters
    try {
        const tickets = await Ticket.find({ userid })
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');

        if (!tickets.length) {
            return res.status(404).json({ message: "No tickets found for this user" });
        }

        return res.status(200).json(tickets);
    } catch (error) {
        console.error("Error getting tickets by user", error);
        res.status(500).json({ message: "Error getting tickets" });
    }
};

const getUserOpenTickets = async (req, res) => {
    const { userid } = req.params; // Get userid from request parameters
    try {
        const tickets = await Ticket.find({ userid, status: "Open" }) // Filter by status "Open"
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');

        if (!tickets.length) {
            return res.status(404).json({ message: "No open tickets found for this user" });
        }

        return res.status(200).json(tickets);
    } catch (error) {
        console.error("Error getting open tickets by user", error);
        res.status(500).json({ message: "Error getting tickets" });
    }
};


const getUserClosedTickets = async (req, res) => {
    const { userid } = req.params; // Get userid from request parameters
    try {
        const tickets = await Ticket.find({ userid, status: "Closed" }) // Filter by status "Open"
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');

        if (!tickets.length) {
            return res.status(404).json({ message: "No closed tickets found for this user" });
        }

        return res.status(200).json(tickets);
    } catch (error) {
        console.error("Error getting closed tickets by user", error);
        res.status(500).json({ message: "Error getting closed tickets" });
    }
};


// delete users
const deleteTicket = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the user by ID
        const ticket = await Ticket.findById(id);
        if (!ticket) {
            console.log("Ticket not found");
            return res.status(404).json({ message: "Ticket not found" });
        }

        // Delete the user
        await Ticket.findByIdAndDelete(id);

        console.log("Ticket deleted successfully:", ticket);
        return res.status(200).json({ message: "Ticket deleted successfully" });
    } catch (error) {
        console.error("Error deleting Ticket", error);
        return res.status(500).json({ message: "Error deleting Ticket" });
    }
};






module.exports = {
    userLogin,
    getUserData,
    createUser,

    deleteUser,
    updateUser,
    createTicket,
    getTicketsByUser,
    getUserOpenTickets,
    getUserClosedTickets,
    deleteTicket
}