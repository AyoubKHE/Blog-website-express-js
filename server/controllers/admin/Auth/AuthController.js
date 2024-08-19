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

        response.render("admin/index", { layout: adminLayout });

    },

    login: async (request, response) => {

        async function loadUserPosts(userID) {
            try {
                return (await User.findOne({ _id: userID }).lean()).posts;

            } catch (error) {
                return null;
            }

        }

        function buildRefreshToken(userID) {
            return jwt.sign(
                {
                    userData:
                    {
                        userID: userID
                    },
                    iat: Date.now(),
                    exp: Math.floor(Date.now() / 1000) + (86400) // one day
                },
                process.env.JWT_SECRET
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
                    exp: Math.floor(Date.now() / 1000) + (900), // 15 minutes
                    // exp: Math.floor(Date.now() / 1000) + (5) // 5 secondes
                },
                process.env.JWT_SECRET
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

            response.cookie('accessToken', accessToken, { secure: true, httpOnly: true });
            response.cookie('refreshToken', refreshToken, { secure: true, httpOnly: true });


            let userPosts = await loadUserPosts(user._id);
            if (userPosts) {
                return response.render("admin/dashboard", { userPosts, layout: adminLayout });
            }
            else {
                response.send("Problem occurred when fetching posts");
            }

        }

    },

    registerForm: async (request, response) => {

        response.render("admin/register", { layout: adminLayout });

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

                response.sendStatus(200);
            } catch (error) {
                console.log(error);
                response.sendStatus(500);
            }
        }


        if (await isUserExists({ username: request.body.username, email: request.body.email })) {
            return;
        }

        await register();

    },

    verifyEmail: async (request, response) => {

        let emailVerificationToken = request.params.emailVerificationToken;

        try {
            let user = await User.findOne({ emailVerificationToken: emailVerificationToken });

            if (user) {
                user.emailVerifiedAt = new Date();
                user.emailVerificationToken = null;
                await user.save();
                response.send("Email verification succeeded");
            }
            else {
                response.send("User not found");
            }
        } catch (error) {
            response.sendStatus(500);
        }

    }
};