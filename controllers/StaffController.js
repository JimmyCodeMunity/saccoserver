const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/StaffModel');
const Ticket = require('../models/TicketModel');


// if (process.env.NODE_ENV !== 'production') {
require('dotenv').config({
    path: './.env'
})
// }


const authtoken = process.env.JWT_SECRET;




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
            console.log("staff data", data)
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
    const {departmentid} =req.params;
    try {
        const ticket = await Ticket.find({departmentid,status:"Open"})
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');

        console.log("ticket", ticket)
        return res.status(200).json(ticket)
    } catch (error) {
        console.error("Error getting tickets", error);
        res.status(500).json({ message: "Error getting tickets" });

    }
}


const getStaffClosedTickets = async (req, res) => {
    const {departmentid} =req.params;
    try {
        const ticket = await Ticket.find({departmentid,status:"Closed"})
            .populate('departmentid', 'deptname depthead assignedStatus')
            .populate('userid', 'username email');

        console.log("ticket", ticket)
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








module.exports = {
    staffLogin,
    getStaffData,
    createStaff,
    getStaffTickets,
    deleteStaff,
    updateStaff,
    getTicketsByDeptHead,
    getStaffClosedTickets
}