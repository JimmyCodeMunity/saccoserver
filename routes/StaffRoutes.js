const express = require('express');
const { staffLogin, getStaffData, createStaff, deleteStaff, updateStaff } = require('../controllers/StaffController');
const router = express.Router();
router.use(express.json())
router.use(express.urlencoded({extended:true}))




// admin routes
router.post("/stafflogin",staffLogin)
router.post("/staffdata",getStaffData)
router.post("/createstaff",createStaff)


// delete
router.delete("/deletestaff/:id",deleteStaff)
router.put("/updatestaff/:id",updateStaff)

module.exports = router;