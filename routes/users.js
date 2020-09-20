var express = require('express');
var router = express.Router();
var checkAuth=require('../utils/checkAuth');

/* GET users listing. */
router.get(`/:username`, checkAuth, function(req, res, next) {
    var user=req.user;
    console.log('The authorized user\'s name: ',user.username);
    var username=req.params.username.replace(':','');
    console.log('The page of the user the client is accessing: ',username);
    if(user.username===username){
        console.log('Successfully authenticated, use the ejs in private mode');
        res.status(200).send('Successfully entered in private mode, the user customization is not done yet. ');
    }else{
        console.log('Access denied: wrong user or user missing');
        res.status(403).send('Access denied: wrong user or user missing');
    }
});

module.exports = router;
