const express = require('express');
const router = express.Router();

const JwtAuth = require("../middlewares/JwtAuth").handle;

const authController = require('../controllers/admin/Auth/AuthController');
const postController = require('../controllers/admin/posts/PostController');
const dashboardController = require('../controllers/admin/dashboard/dashboardController');

router.get("/dashboard", JwtAuth, dashboardController.index);

router.get('/login', authController.loginForm);
router.post('/login', authController.login);
router.get('/register', authController.registerForm);
router.post('/register', authController.register);
router.get('/verify-email/:emailVerificationToken', authController.verifyEmail);


router.get("/post/create", JwtAuth, postController.create);
router.post("/post", JwtAuth, postController.store);
router.get("/post/:id/edit", JwtAuth, postController.edit);
router.put("/post/:id", JwtAuth, postController.update);

module.exports = router;