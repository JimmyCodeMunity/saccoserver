const express = require('express');
const { getUserData, userLogin, deleteUser, updateUser, createUser } = require('../controllers/UserController');
const router = express.Router();
router.use(express.json())
router.use(express.urlencoded({extended:true}))




// admin routes
router.post("/userlogin",userLogin)
router.post("/userdata",getUserData)
router.post("/createuser",createUser)


// delete
router.delete("/deleteuser/:id",deleteUser)
router.put("/updateuser/:id",updateUser)

module.exports = router;