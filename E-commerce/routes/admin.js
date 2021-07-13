var express = require('express');
var router = express.Router();
var mongodb = require('mongodb')
var db = require('monk')('localhost:27017/E-CommerceProject')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var flash = require("express-flash")
var multer = require('multer')
var { check, validationResult } = require('express-validator')

//db connenct
var admins = db.get('admin')
var categories = db.get('categories')
var products = db.get('products')

//image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".jpg")
  }
})
var upload = multer({ storage: storage })

//login สำหรับ admin 
router.get('/login', function (req, res, next) {
  res.render('admin/login');
});

router.get('/manage', enSureAuthenicated, function (req, res, next) {
  res.render('admin/manage');
});

router.post('/login', passport.authenticate('admin-local', {
  failureRedirect: '/admin/login',
  failureFlash: true
}),
  function (req, res, next) {
    req.flash("success", "ลงชื่อเข้าใช้แล้ว")
    res.redirect('/admin/manage')
  })

passport.serializeUser(function (user, done) {
  done(null, user[0]._id);
});
passport.deserializeUser(function (id, done) {
  admins.find({ _id: id }).then(function (row) {
    var user = row[0]
    done(null, user)
  });
});

passport.use('admin-local',new LocalStrategy({
  usernameField:'username',
  passwordField:'password'
},
function (username, password, done) {
  admins.find({ username: username }, function (err, user) {
    if (err) throw error
    if (user.length == 0) {
      return done(null, false, { message: 'ไม่พบผู้ใช้งานนี้' })
    }
    if (user.length > 0) {
      if (user[0].password == password) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'รหัสผ่านไม่ถูกต้อง' })
      }
    }
  })
}))

function enSureAuthenicated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect('/admin/login')
  }
}

router.get('/logout', function (req, res, next) {
  req.logout()
  res.redirect('/admin/login')
})

//add categories
router.get('/manage/addcategory', enSureAuthenicated, function (req, res, next) {
  res.render('admin/addcategory')
})

router.post('/addcategory', function (req, res, next) {
  categories.insert({ name: req.body.name }, {}, function (err) {
    if (err) throw err
    res.redirect('/admin/manage/addcategory')
  })
})


//add product
router.get('/manage/addproduct', enSureAuthenicated, function (req, res, next) {
  categories.find({}, {}, function (err, category) {
    res.render('admin/addproduct', { categories: category })
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
      res.render('admin/addproduct', { categories: category, errors: errors })
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
      category: req.body.category
    }, {}, function (err) {
      if (err) throw err
      res.location('/admin/manage/addproduct')
      res.redirect('/admin/manage/addproduct')
    })
  }
})

//product list
router.get('/manage/viewproduct', function (req, res, next) {
  categories.find({}, {}, function (err, category) {
    products.find({}, {}, function (err, product) {
      res.render('admin/viewproduct', { categories: category, products: product });
    })
  })
});

//edit product
router.get('/manage/editproduct/:id', enSureAuthenicated, function (req, res, next) {
  categories.find({}, {}, function (err, category) {
    products.find({ _id: req.params.id }, {}, function (err, product) {
      res.render('admin/editproduct', { categories: category, products: product })
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
      res.render('admin/addproduct', { categories: category, errors: errors })
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
        res.location('/admin/manage/viewproduct')
        res.redirect('/admin/manage/viewproduct')
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
        res.location('/admin/manage/viewproduct')
        res.redirect('/admin/manage/viewproduct')
      })
    }
  }
})

//delete
router.get('/manage/deleteproduct/:id', function(req, res, next) {
  products.remove({_id:req.params.id})
  res.redirect('/admin/manage/viewproduct')
});

module.exports = router;
