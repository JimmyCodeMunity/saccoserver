const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require("../models/AdminModel");
const User = require('../models/UserModel');


// if (process.env.NODE_ENV !== 'production') {
require('dotenv').config({
    path: './.env'
})
// }


const authtoken = process.env.JWT_SECRET;




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
            console.log("useremail: ", useremail)
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




module.exports = {
    userLogin,
    getUserData,
    createUser,

    deleteUser,
    updateUser
}