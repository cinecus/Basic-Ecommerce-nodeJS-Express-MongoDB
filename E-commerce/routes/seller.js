var express = require('express');
var router = express.Router();
var mongodb = require('mongodb')
var db = require('monk')('localhost:27017/E-CommerceProject')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var flash = require("express-flash")
var multer = require('multer')
var { check, validationResult } = require('express-validator')
var session = require('express-session')
var moment = require('moment')

//db connenct
var admins = db.get('admin')
var categories = db.get('categories')
var products = db.get('products')
var sellers = db.get('sellers')
var bills = db.get('bills')
var deliverybills = db.get('deliverybills')

//upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".jpg")
  }
})
var upload = multer({ storage: storage })

//manage seller
router.get('/manage',function(req,res,next){
    res.render('seller/manage')
  })
  
//add product
router.get('/addproduct', function (req, res, next) {
    categories.find({}, {}, function (err, category) {
      res.render('seller/addproduct', { categories: category })
    })
})

router.post('/addproduct', upload.single("image"), [
  check('name', 'กรุณาระบุชื่อสินค้า').not().isEmpty(),
  check('description', 'กรุณาระบุคำอธิบายสินค้า').not().isEmpty(),
  check('price', 'กรุณาระบุราคาสินค้า').not().isEmpty(),
  check('category', 'กรุณาระบุหมวดหมู่ให้ถูกต้อง').not().isEmpty()
], function (req, res, next) {
  var result = validationResult(req)
  var errors = result.errors
  if (!result.isEmpty()) {
    categories.find({}, {}, function (err, category) {
      res.render('seller/addproduct', { categories: category, errors: errors })
    })
  } else {
    if (req.file) {
      var productimage = req.file.filename
    } else {
      var productimage = "No image"
    }
    products.insert({
      name: req.body.name,
      description: req.body.description,
      image: productimage,
      price: parseFloat(req.body.price),
      category: req.body.category,
      seller:req.body.seller
    }, {}, function (err) {
      if (err) throw err
      res.location('/seller/addproduct')
      res.redirect('/seller/addproduct')
    })
  }
})

//product list
router.get('/viewproduct', function (req, res, next) {
  categories.find({}, {}, function (err, category) {
    products.find({seller:req.user.username}, {}, function (err, product) {
      res.render('seller/viewproduct', { categories: category, products: product });
    })
  })
});

//edit product
router.get('/editproduct/:id', function (req, res, next) {
  categories.find({}, {}, function (err, category) {
    products.find({ _id: req.params.id }, {}, function (err, product) {
      res.render('seller/editproduct', { categories: category, products: product })
    })
  })
})

router.post('/editproduct', upload.single("image"), [
  check('name', 'กรุณาระบุชื่อสินค้า').not().isEmpty(),
  check('description', 'กรุณาระบุคำอธิบายสินค้า').not().isEmpty(),
  check('price', 'กรุณาระบุราคาสินค้า').not().isEmpty(),
  check('category', 'กรุณาระบุหมวดหมู่ให้ถูกต้อง').not().isEmpty()
], function (req, res, next) {
  var result = validationResult(req)
  var errors = result.errors
  if (!result.isEmpty()) {
    categories.find({}, {}, function (err, category) {
      res.render('/editproduct', { categories: category, errors: errors })
    })
  } else {
    if (req.file) {
      var productimage = req.file.filename
      products.update({ _id: req.body.id }, {
        $set: {
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          category: req.body.category,
          image: productimage
        }
      }, function (err) {
        if (err) throw err
        res.location('/seller/viewproduct')
        res.redirect('/seller/viewproduct')
      })
    } else {
      products.update({ _id: req.body.id }, {
        $set: {
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          category: req.body.category
        }
      }, function (err) {
        if (err) throw err
        res.location('/seller/viewproduct')
        res.redirect('/seller/viewproduct')
      })
    }
  }
})

//delete
router.get('/deleteproduct/:id', function(req, res, next) {
  products.remove({_id:req.params.id})
  res.redirect('/seller/viewproduct')
});

//tracking
router.get('/tracking',function(req,res,next){
  deliverybills.find({seller:req.user.username},{},function(err,deliverybill){
    if(err) throw err
    res.render('seller/sellertracking',{deliverybills:deliverybill,moment:moment})
  })
})

//add tracking
router.get('/addtracking/:id',function(req,res,next){
  res.render('seller/addtracking',{deliverybill_id:req.params.id})
})

router.post('/addtracking',function(req,res,next){
  deliverybills.findOneAndUpdate({_id:req.body.bill_id},{
    $set:{
      trackingnumber:req.body.trackingnumber
    }
  },function(err){
    if(err) throw err
    res.location('/seller/tracking')
    res.redirect('/seller/tracking')
  })
})
module.exports = router;