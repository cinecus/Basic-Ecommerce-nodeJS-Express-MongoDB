var express = require('express');
var router = express.Router();
var mongodb = require('mongodb')
var db = require('monk')('localhost:27017/E-CommerceProject')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var flash = require("express-flash")
var multer = require('multer')
var { check, validationResult } = require('express-validator')
var stripe = require('stripe')('sk_test_51J5sztExKBWaCkFD1sRYIR6kRpEOiSYeB2UpccBIJXoxhT44GHZueDoBeMeqcfq9SyKlCn2R0AVQyRsbckEdmjYt00YpgLOfVu')
var moment = require('moment')

var categories = db.get('categories')
var products = db.get('products')
var customers = db.get('customers')
var users = db.get('users')
var bills = db.get('bills')
var deliverybills = db.get('deliverybills')

router.post('/cart/:id', function(req, res, next) {
    var product_id = req.body.product_id
    req.session.cart = req.session.cart || {}
    var cart = req.session.cart
    products.find({
        _id:product_id
    },{},function(err,product){
        //กรณีซื้อชิ้นเดิมมากกว่า 1 ชิ้น
        if(cart[product_id]){
            cart[product_id].qty++;
        }else{
            product.forEach(function(item){
                cart[product_id]={
                    item:item._id,
                    title:item.name,
                    price:item.price,
                    qty:1
                }
            })
        }
        res.redirect('/')
        //cart id, name , price , qty  
    })     
  });

router.get('/cart', function(req, res, next) {
    var cart = req.session.cart; //ตะกร้าสินค้า
    var displayCart = {items:[],total:0}
    var total=0
    for(item in cart){
        displayCart.items.push(cart[item])
        total += cart[item].qty * cart[item].price
    }
    displayCart.total = total
    users.find({username:req.user.username},{},function(err,user){
        res.render('customer/cart',{cart:displayCart,users:user})
    })
});

router.get('/info',function(req,res,next){
    users.find({username:req.user.username},{},function(err,user){
        res.render('customer/info',{users:user})
    })
})

router.post('/info',function(req,res,next){
    users.findOneAndUpdate({ username: req.user.username }, {
        $set: {
          name: req.body.name,
          tel: req.body.tel,
          address: req.body.address,
        }
      }, function (err) {
        if (err) throw err
        res.location('/customer/cart')
        res.redirect('/customer/cart')
      })
})

router.post('/payment',function(req,res,next){
    var token = req.body.stripeToken
    var amount = req.body.amount
    var cart = req.session.cart
    var charge = stripe.charges.create({
    amount:amount,
    currency:"usd",
    source:token
  }
  ,function(err,charge){
    if(err) throw err
  })
  bills.insert({
      customer:req.user.username,
      name:req.body.name,
      tel:req.body.tel,
      address:req.body.address,
      date: new Date(),
      cart:req.session.cart
  },{},
    function (err,bill) {
        Object.values(cart).forEach(function(item){
            products.find({_id:item.item},{},function(err,product){
                product.forEach(function(entry){
                    deliverybills.insert({
                        bill_id:bill._id,
                        product_id:entry._id,
                        seller:entry.seller,
                        product_name:entry.name,
                        customer:req.user.username,
                        address:req.body.address,
                        qty:item.qty,
                        date:new Date(),
                        trackingnumber:"",
                        status:"Wait"
                    },{},function(err){
                        if (err) throw err
                    })
                })
            })
        })
    if (err) throw err
    req.session.cart = null
    res.redirect('/')
  })
})

router.get('/tracking',function(req,res,next){
    users.find({username:req.user.username},{},function(err,user){
        bills.find({customer:req.user.username},{},function(err,bill){
            deliverybills.find({customer:req.user.username},{},function(err,deliverybill){
                res.render('customer/customertracking',{users:user,bills:bill,moment:moment,deliverybills:deliverybill})
            })
        })
    })
})


module.exports = router;