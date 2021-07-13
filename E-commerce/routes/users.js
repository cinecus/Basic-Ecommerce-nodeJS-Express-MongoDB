var express = require('express');
var router = express.Router();
var mongodb = require('mongodb')
var db = require('monk')('localhost:27017/E-CommerceProject')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var flash = require("express-flash")
var {check,validationResult} = require('express-validator')
var bcrypt = require('bcrypt')

//db connenct
var admins = db.get('admin')
var categories = db.get('categories')
var products = db.get('products')
var users = db.get('users')
var sellers = db.get('sellers')
var customers = db.get('customers')
//register
router.get('/register',function(req,res,next){
  res.render('user/register')
})


router.post('/register',[
  check('username','กรุณาระบุ Username').not().isEmpty().custom(value=>{
    return users.find({username:value}).then(user=>{
      if (user.length >0) {
        return Promise.reject('Username นี้ถูกใช้งานแล้ว');
      }
    })
  }),
  check('password','กรุณาระบุ Password').not().isEmpty(),
  check('email','กรุณาระบุ Email').isEmail().custom(value=>{
    return users.find({email:value}).then(user=>{
      if (user.length >0) {
        return Promise.reject('Email นี้ถูกใช้งานแล้ว');
      }
    })
  }),
  check('role','กรุณาระบุประเภทผู้ใช้งาน').not().isEmpty()
],async function(req,res,next){
  const result = validationResult(req)
  var errors = result.errors
  if(!result.isEmpty()){
    res.render('user/register',{errors:errors})
  }else{
    //insert Data
    var username = req.body.username
    var hashedPassword = await bcrypt.hash(req.body.password, 10)
    var email = req.body.email
    var role = req.body.role
    newuser = {
      username:username,
      password:hashedPassword,
      email:email,
      role:role
    }
    users.insert(newuser,function(err,success){
      if(err){
        res.send(err)
      }
    })
    if(newuser.role=="seller"){
      sellers.insert({username:username},function(err,success){
        if(err){
          res.send(err)
        }else{
          res.location('/user/login')
          res.redirect('/user/login')
        }
      })
    }
    if(newuser.role=="customer"){
      customers.insert({username:username},function(err,success){
        if(err){
          res.send(err)
        }else{
          res.location('/user/login')
          res.redirect('/user/login')
        }
      })
    }
  }
})

//login
router.get('/login',function(req,res,next){
  res.render('user/login')
})


router.post('/login', passport.authenticate('user-local', {
  failureRedirect: '/user/login',
  failureFlash: true
}),
  function (req, res, next) {
    req.flash("success", "ลงชื่อเข้าใช้แล้ว")
    if(req.user[0].role=="seller"){
      res.redirect('/seller/manage')
    }
    if(req.user[0].role=="customer"){
      res.redirect('/')
    }
  })

passport.serializeUser(function (user, done) {
  done(null, user[0]._id);
});
passport.deserializeUser(function (id, done) {
  users.find({ _id: id }).then(function (row) {
    var user = row[0]
    done(null, user)
  });
});

function comparePassword(password,hash,callback){
  bcrypt.compare(password,hash,function(err,isMatch){
    callback(null,isMatch)
  })
}

passport.use('user-local',new LocalStrategy(function(username,password,done){
  users.find({username:username},function(err,user){
    if(err) throw error
    if(user.length==0){
      return done(null,false,{ message: 'ไม่พบผู้ใช้งานนี้' })
    }
    if(user.length >0){
    comparePassword(password,user[0].password,function(err,isMatch){
      if(err) throw err
      if(isMatch){
        return done(null,user)
      }else{
        return done(null,false,{ message: 'รหัสผ่านไม่ถูกต้อง' })
      }
    })
  }
  })
}))
function enSureAuthenicated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect('/user/login')
  }
}

router.get('/logout', function (req, res, next) {
  req.logout()
  res.redirect('/user/login')
})



module.exports = router;
