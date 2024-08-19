const express = require('express');
const router = express.Router();

const homeController = require('../controllers/main/HomeController');
const aboutController = require('../controllers/main/AboutController');

router.get('/', homeController.index);

router.get('/post/:id', homeController.getSinglePost);

router.post('/search', homeController.search);

router.get('/about', aboutController.index);


module.exports = router;
