var jwt=require('jsonwebtoken');
/*var store=require('store');*/
var secret=require('./secret');
var mysql=require('mysql');
var serverConfig=require('./serverConfig');
module.exports=(req,res,next)=>{
    var connection=mysql.createConnection(serverConfig);
    var token;
    if(req.headers.authorization) {
        token= req.headers.authorization.split(" ")[1];
    }else{
        token=req.body.token || req.query.token || req.headers['x-access-token'];
    }
    if (token&&token!=="") {
        console.log("got the token:  "+token+" and the secret "+secret);
        try {
            var decoded = jwt.verify(token, secret);
            if (decoded && decoded !== "") {
                console.log("decoded the token: "+decoded);
                /*store.set('user', decoded);*/
                //go to the database and get the fullstack user;
                connection.connect();
                connection.query(`SELECT * FROM users WHERE uid=${decoded.uid}`,function(err,result){
                    if(err) console.log(err);
                    else {
                        req.user = {
                            uid: result[0].uid,
                            username: result[0].username,
                            firstname: result[0].firstname,
                            lastname: result[0].lastname,
                            email: result[0].email,
                            creation_date: result[0].creation_date,
                            location: result[0].location,
                            exp:decoded.exp
                        };
                        console.log('stored user' + req.user.uid/*+store.get('user').uid*/);
                        return next();
                    }
                });
            }
        }catch(err){
            console.log('token_error: '+err);
            return res.render('denied', {
                id: 'token_error',
                message: 'ERROR: ' + err + '. Please wait until we redirect you to the page to get new tokens'
            });
        }
    } else {
        console.log('token not found');
        return res.render('denied',{
            id: 'token_error',
            message:'ERROR: '+'token not found. '+'\t Please wait until we redirect you to the page to get tokens'
        });
    }
};