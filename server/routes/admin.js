const express = require('express');
const router = express.Router();

const JwtAuth = require("../middlewares/JwtAuth").handle;

const authController = require('../controllers/admin/Auth/AuthController');

router.get('/login', authController.loginForm);
router.post('/login', authController.login);
router.get('/register', JwtAuth, authController.registerForm);
router.post('/register', authController.register);
router.get('/verify-email/:emailVerificationToken', authController.verifyEmail);

module.exports = router;