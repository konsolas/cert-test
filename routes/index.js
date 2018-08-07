var express = require('express');
var router = express.Router();
var mysql= require('mysql');
var serverConfig=require('../public/javascripts/serverConfig');
/*
var store=require('store');
*/
var checkAuth=require('../public/javascripts/checkAuth');
/* GET home page. */
router.get('/',checkAuth, function(req, res, next) {
    var user=req.user;/*store.get('user');*/ //get the user from local storage;
    console.log('got the user: '+JSON.stringify(user));
    //render the user with the infos.
    res.render('index',{subject: user.username, issuer:'localhost', exp: user.exp});
});


//Export the module
module.exports = router;
