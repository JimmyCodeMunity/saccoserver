const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/StaffModel');
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




const staffLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingStaff = await Staff.findOne({ email })
        if (!existingStaff) {
            return res.status(401).json({ message: "Staff not found" })
        }
        else {
            const isMatch = await bcrypt.compare(password, existingStaff.password)
            if (!isMatch) {
                console.log("incorret password")
                return res.status(401).json({ message: "Incorrect password" })
            }
            else {
                const token = await jwt.sign({ email: existingStaff.email }, authtoken);
                console.log("user logged in")

                return res.json({ status: "success", token })
            }
        }

    } catch (error) {

    }
}


const getStaffData = async (req, res) => {
    const { token } = req.body;
    try {
        if (!token) {
            console.log("no token provided");
            return res.status(401).json({ msg: "No token provided" });
        } else {
            const staff = await jwt.verify(token, authtoken);
            const staffemail = staff.email
            console.log("staffemail: ", staffemail)
            const data = await Staff.findOne({ email: staffemail })
                .populate('departmentid', 'deptname depthead assignedStatus')
                ;
            // console.log("staff data", data)
            return res.status(200).json(data);
        }

    } catch (error) {
        console.error("error getting user data ", error);
        res.status(500).json(error);

    }
}


const createStaff = async (req, res) => {
    const { username, email, phone, password } = req.body
    try {
        const existingstaff = await Staff.findOne({ email })
        if (existingstaff) {
            console.log("Staff with that email already exists");
            return res.status(400).json({ message: "Staff with that email exists" });
        }
        else {
            const hashedPassword = await bcrypt.hash(password.trim(), 10);
            console.log("Hashed password:", hashedPassword);
            const user = await Staff.create({
                username: username.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password: hashedPassword,
            });
            console.log("Staff created successfully:", user);
            return res.status(201).json({ message: "Staff created successfully", user });
        }
    } catch (error) {
        console.error("error creating Staff", error);
        res.status(500).json({ message: "Error creating Staff" });

    }
}








// delete users
const deleteStaff = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the user by ID
        const user = await Staff.findById(id);
        if (!user) {
            console.log("Staff not found");
            return res.status(404).json({ message: "Staff not found" });
        }

        // Delete the user
        await Staff.findByIdAndDelete(id);

        console.log("Staff deleted successfully:", user);
        return res.status(200).json({ message: "Staff deleted successfully" });
    } catch (error) {
        console.error("Error deleting Staff", error);
        return res.status(500).json({ message: "Error deleting Staff" });
    }
};


// update user
const updateStaff = async (req, res) => {
    const { id } = req.params;
    const { username, email, phone, password } = req.body;
    console.log("Updating user:", { id, username, email, phone, password });
    // return

    // find by id and update
    try {
        const user = await Staff.findByIdAndUpdate(id, { username, email, phone }, { new: true });
        if (!user) {
            console.log("Staff not found");
            return res.status(404).json({ message: "Staff not found" });
        }

        // Hash password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password.trim(), 10);
            user.password = hashedPassword;
        }

        await user.save();
        console.log("Staff updated successfully:", user);
        return res.status(200).json({ message: "Staff updated successfully", user });
    } catch (error) {
        console.error("Error updating user", error);
        return res.status(500).json({ message: "Error updating Staff" });
    }
}


const getStaffTickets = async (req, res) => {
    const { departmentid } = req.params;
    try {
        const ticket = await Ticket.find({ departmentid, status: "Open" })
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');

        // console.log("ticket", ticket)
        return res.status(200).json(ticket)
    } catch (error) {
        console.error("Error getting tickets", error);
        res.status(500).json({ message: "Error getting tickets" });

    }
}


const getStaffClosedTickets = async (req, res) => {
    const { departmentid } = req.params;
    try {
        const ticket = await Ticket.find({ departmentid, status: "Closed" })
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');

        // console.log("ticket", ticket)
        return res.status(200).json(ticket)
    } catch (error) {
        console.error("Error getting tickets", error);
        res.status(500).json({ message: "Error getting tickets" });

    }
}

const getTicketsByDeptHead = async (req, res) => {
    const { depthead } = req.params; // Get depthead (staff ID) from request parameters
    try {
        const tickets = await Ticket.find()
            .populate({
                path: 'departmentid',
                match: { depthead }, // Filter only departments managed by this depthead
                select: 'deptname depthead assignedStatus'
            })
            .populate('userid', 'username email');

        // Filter out tickets where departmentid is null due to no match
        const filteredTickets = tickets.filter(ticket => ticket.departmentid !== null);

        if (!filteredTickets.length) {
            return res.status(404).json({ message: "No tickets found for this department head" });
        }

        return res.status(200).json(filteredTickets);
    } catch (error) {
        console.error("Error getting tickets by department head", error);
        res.status(500).json({ message: "Error getting tickets" });
    }
};


const sendTicketConfirm = async ({ username, email, title, description, ticketid, priority,comment }) => {
    console.log("rec", email)
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
            <title>Ticket Response</title>
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
                    <p>Your Ticket has been responded to successfully:</p>
                    <div class="details">
                        <p>Ticket Number: #${ticketid}</p>
                        <p>Title: ${title}</p>
                        <p>Priority: ${priority}</p>
                        <p>Complain:${description}.</p>
                        <p>Response:${comment}.</p>
                    </div>
                    
                    
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

// update ticket by id
const updateTicketStaff = async (req, res) => {
    const { ticketid } = req.params;
    const { status, comment } = req.body;
    // console.log("Updating ticket:", { id, status });

    try {
        const ticket = await Ticket.findByIdAndUpdate(ticketid, { status, comment }, { new: true });
        if (!ticket) {
            console.log("Ticket not found");
            return res.status(404).json({ message: "Ticket not found" });
        }
        const createdticket = await Ticket.findById(ticketid)
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');
        console.log("updated ticket saved", createdticket)


        await ticket.save();
        sendTicketConfirm({
            username: createdticket?.userid?.username,
            email: createdticket?.userid?.email,
            priority: createdticket?.priority,
            title: createdticket?.title,
            description: createdticket?.description,
            comment: createdticket?.comment,
            ticketid: createdticket?._id// replace with actual login URL
        })
        console.log("Ticket updated successfully:", ticket);
        return res.status(200).json({ message: "Ticket updated successfully", ticket });
    } catch (error) {
        console.error("Error updating ticket", error);
        return res.status(500).json({ message: "Error updating ticket" });
    }
}








module.exports = {
    staffLogin,
    getStaffData,
    createStaff,
    getStaffTickets,
    deleteStaff,
    updateStaff,
    getTicketsByDeptHead,
    getStaffClosedTickets,
    updateTicketStaff
}