var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongodb = require('mongodb')
var db = require('monk')('localhost:27017/E-CommerceProject')
var session = require('express-session')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var flash = require("express-flash")
var { check, validationResult } = require('express-validator')
var stripe = require('stripe')('sk_test_51J5sztExKBWaCkFD1sRYIR6kRpEOiSYeB2UpccBIJXoxhT44GHZueDoBeMeqcfq9SyKlCn2R0AVQyRsbckEdmjYt00YpgLOfVu')

var multer = require('multer')
var upload = multer({dest:'./public/images'})

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var productRouter = require('./routes/product');
var sellerRouter = require('./routes/seller');
var customerRouter = require('./routes/customer');


var app = express();

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}))
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(passport.initialize())
app.use(passport.session())
app.use(flash());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('*',function(req,res,next){
  res.locals.user = req.user || null
  next()
})

app.locals.formatMoney = function(number){
  return parseFloat(number).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
}

app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/user', usersRouter);
app.use('/product', productRouter);
app.use('/seller', sellerRouter);
app.use('/customer', customerRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
