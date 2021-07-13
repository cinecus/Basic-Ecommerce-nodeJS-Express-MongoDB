var express = require('express');
var router = express.Router();
var mongodb = require('mongodb')
var db = require('monk')('localhost:27017/E-CommerceProject')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var flash = require("express-flash")


//db connenct
var admins = db.get('admin')
var categories = db.get('categories')
var products = db.get('products')

router.get('/searchproduct/', function (req, res, next) {
    var categoryname = req.query.category
    if (categoryname) {
        categories.find({}, {}, function (err, category) {
            products.find({ category: categoryname }, {}, function (err, product) {
                res.render('product/searchproduct', { categories: category, products: product });
            })
        })
    }
});

router.get('/showproduct/:id', function (req, res, next) {
    categories.find({}, {}, function (err, category) {
        products.find(req.params.id, {}, function (err, product) {
            res.render('product/showproduct', { categories: category, products: product });
        })
    })
});




module.exports = router;