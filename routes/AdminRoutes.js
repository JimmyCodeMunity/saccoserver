const express = require('express');
const { createAdmin, adminLogin, getAdminData, createUser, createStaff, getUsers, getStaff, createDepartment, getDepartments, getAvailableDepartments } = require('../controllers/AdminController');
const router = express.Router();
router.use(express.json())
router.use(express.urlencoded({extended:true}))




// admin routes
router.post("/createadmin",createAdmin)
router.post("/adminlogin",adminLogin)
router.post("/admindata",getAdminData)
router.post("/createuser",createUser)
router.post("/createstaff",createStaff)
router.post("/createdepartment",createDepartment)
router.get("/getdepartments",getDepartments)
router.get("/getavailabledepartments",getAvailableDepartments)
router.get("/getusers",getUsers)
router.get("/getstaff",getStaff)

module.exports = router;