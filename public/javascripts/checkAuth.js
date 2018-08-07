const jwt=require('jsonwebtoken');
/*var store=require('store');*/
const secret=require('./secret');
const query=require('./sql');
module.exports=async(req,res,next)=>{
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
                const queryResults = await query(`SELECT * FROM users WHERE uid=${decoded.uid}`);
                req.user = {
                    uid: queryResults[0].uid,
                    username: queryResults[0].username,
                    firstname: queryResults[0].firstname,
                    lastname: queryResults[0].lastname,
                    email: queryResults[0].email,
                    creation_date: queryResults[0].creation_date,
                    location: queryResults[0].location,
                    exp:decoded.exp
                };
                console.log('stored user' + req.user.uid/*+store.get('user').uid*/);
                return next();
            }
        }catch(err){
            console.log('token_error: '+err);
            return res.status(401).render('unauthorized', {
                id: 'token_error',
                message: 'ERROR: ' + err + '. Please wait until we redirect you to the page to get new tokens'
            });
        }
    } else {
        console.log('token not found');
        return res.status(401).render('unauthorized',{
            id: 'token_error',
            message:'ERROR: '+'token not found. '+'\t Please wait until we redirect you to the page to get tokens'
        });
    }
};