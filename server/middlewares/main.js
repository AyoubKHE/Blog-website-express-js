const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
// const session = require('express-session');
// const MongoStore = require("connect-mongo");

module.exports = {
    setMiddlewars: (app) => {

        app.use(express.static('public'));
        app.use(expressLayout);
        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());
        app.use(cookieParser());
        app.use(methodOverride("_method"));

        // app.use(session({
        //     secret: process.env.SESSION_SECRET,
        //     resave: false,
        //     saveUninitialized: true,
        //     store: MongoStore.create({
        //         mongoUrl: process.env.MONGODB_URI
        //     }),
        //     cookie: {
        //         maxAge: new Date(Date.now() + (3600000)),
        //         secure: true,
        //         httpOnly: true
        //     }
        // }));


        // app.use((request, response, next) => {
        //     response.locals.user = request.session.user;
        //     next();
        // });

        app.use('/', require('../routes/main'));
        app.use('/admin', require('../routes/admin'));
    }
}

