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
router.get('/change',checkAuth,function(req,res,next){
    //Change
    //get the req.user and render the change.ejs file page with all of the shits like:
    //username-firstname-lastname-email-location (if not in the token, get from db)
});
router.post('/change',checkAuth,function (req,res,next) {
    res.send("Successfully authenticated");
    //Change.ejs BACK -->form
    //get the changed infos
    //change in database
    //return a new token
});
//TESTING CODE BELOW
/*router.get('/test',function (req,res) {
    console.log("test: "+req.user/!*+store.get('user')*!/);
    res.send(req.user/!*store.get('user')*!/);
});*/
//Export the module
module.exports = router;
