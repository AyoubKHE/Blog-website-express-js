const User = require("../../../models/User");
const adminLayout = "./layouts/admin.ejs";
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ejs = require("ejs");
const nodemailer = require("nodemailer");

const withTransaction = require("../../../config/db").withTransaction;

module.exports = {
    loginForm: async (request, response) => {

        return response.render("admin/index", { layout: adminLayout });

    },

    login: async (request, response) => {

        function buildRefreshToken(userID) {
            return jwt.sign(
                {
                    userData:
                    {
                        userID: userID
                    },
                    iat: Date.now(),
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: 24 * 60 * 60 // une journée
                }
            );
        }

        function buildAccessToken(userID) {
            return jwt.sign(
                {
                    userData:
                    {
                        userID: userID
                    },
                    iat: Date.now(),
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: 15 * 60 // 15 minutes,
                    // expiresIn: 5 //  5 secondes
                }
            );

        }

        async function areCredentialsValid() {
            try {

                let user = await User.findOne({ email: request.body.email });

                if (user) {
                    let isPasswordValid = await bcrypt.compare(request.body.password, user.password);
                    if (!isPasswordValid) {
                        response.send("Invalid credentials");
                        return null;
                    }

                    return user;
                }
                else {
                    response.send("Invalid credentials");
                    return null;

                }
            } catch (error) {
                response.sendStatus(500);
                return null;
            }

        }

        let user = await areCredentialsValid();

        if (!user) {
            return;
        }
        else {

            if (user.emailVerifiedAt == null) {
                return response.send("Your account is not yet confirmed. A confirmation email has been sent to you. Please check your inbox to confirm your email address.");
            }

            const accessToken = buildAccessToken(user._id);
            const refreshToken = buildRefreshToken(user._id);

            response.cookie('accessToken', accessToken, { secure: true, httpOnly: true, maxAge: 24 * 15 * 60 * 1000 });
            response.cookie('refreshToken', refreshToken, { secure: true, httpOnly: true, maxAge: 24 * 15 * 60 * 1000 });

            let userPosts = user.posts;
            if (userPosts) {
                return response.render("admin/dashboard", { userPosts, layout: adminLayout });
            }
            else {
                return response.send("Problem occurred when fetching posts");
            }

        }

    },

    registerForm: async (request, response) => {

        return response.render("admin/register", { layout: adminLayout });

    },

    register: async (request, response) => {

        async function isUserExists(userData) {
            try {

                let user = await User.findOne({
                    $or: [
                        { username: userData.username },
                        { email: userData.email }
                    ]
                }).exec();

                if (user) {
                    // response.json({
                    //     message: "User already exists",
                    // }).send();

                    response.send("User already exists");
                    return true;
                }


            } catch (error) {
                console.error('Error checking email existence:', error);
                response.sendStatus(500);
                return true;
            }

            return false;
        }


        async function sendEmailVerification(emailVerificationToken) {

            let emailHtml = await ejs.renderFile("views/emails/email_verification.ejs", {
                username: request.body.username,
                emailVerificationToken: emailVerificationToken
            })

            const transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                secure: true,
                auth: {
                    user: process.env.MAIL_FROM_ADDRESS,
                    pass: process.env.MAIL_PASSWORD
                },
            })

            try {
                const info = await transporter.sendMail({
                    from: `Ayoub < ${process.env.MAIL_FROM_ADDRESS} >`,
                    to: request.body.email,
                    subject: 'Email verification',
                    html: emailHtml
                });

                return info;
            } catch (error) {
                console.log(`Message not sent : ${error}`);
                throw error;
            }
        }


        async function register() {

            try {

                let emailVerificationToken = crypto.randomBytes(30).toString('hex').slice(0, 30);
                let hashedPassword = await bcrypt.hash(request.body.password, 10);

                await withTransaction(async (session) => {

                    await User.create([{
                        username: request.body.username,
                        email: request.body.email,
                        password: hashedPassword,
                        emailVerificationToken: emailVerificationToken,
                    }], { session });

                    await sendEmailVerification(emailVerificationToken);
                });

                return response.sendStatus(200);
            } catch (error) {
                console.log(error);
                return response.sendStatus(500);
            }
        }


        if (await isUserExists({ username: request.body.username, email: request.body.email })) {
            return;
        }

        return await register();

    },

    verifyEmail: async (request, response) => {

        let emailVerificationToken = request.params.emailVerificationToken;

        try {
            let user = await User.findOne({ emailVerificationToken: emailVerificationToken });

            if (user) {
                user.emailVerifiedAt = new Date();
                user.emailVerificationToken = null;
                await user.save();
                return response.send("Email verification succeeded");
            }
            else {
                return response.send("User not found");
            }
        } catch (error) {
            return response.sendStatus(500);
        }

    },

    logout: async (request, response) => {

        response.cookie('accessToken', '', { maxAge: 1 });
        response.cookie('refreshToken', '', { maxAge: 1 });

        return response.sendStatus(200);
    },
};