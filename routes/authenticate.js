var express = require('express');
var router = express.Router();
var mysql= require('mysql');
var secret=require('../public/javascripts/secret');
var jwt=require('jsonwebtoken');
var serverConfig=require('../public/javascripts/serverConfig');
/* GET home page. */


router.get('/', function(req, res, next) {
    const cert = req.socket.getPeerCertificate();
    const exp=new Date(cert.valid_to);
    const connection = mysql.createConnection(serverConfig);
    connection.connect();
    if (req.client.authorized) {
        var CN=cert.subject.CN;
        console.log(`got the cert, CN: ${CN}, expiring at ${exp}`);
        //Auth
        connection.query(`SELECT * FROM users WHERE uuid="${CN}"`,function(err,result){
            if(err) console.log(err);
            console.log("query"+`SELECT * FROM users WHERE uuid="${CN}"`);
            if(result&&result!==""){
                var username=result[0].username;
                console.log(`login by: ${username} at ${new Date()}`);
                console.log({subject: result[0].username, issuer:cert.issuer.CN, valid_to: cert.valid_to});
                //return token
                var token=jwt.sign({
                    uid: result[0].uid
                },secret,{
                    expiresIn: "1h" //1h
                });
                /*//send to the main page;
                res.status(200).render('index',{subject: result[0].username, issuer:cert.issuer.CN, valid_to: cert.valid_to});*/
                //send the json
                console.log(`generated the token ${token} with key ${secret}`)
                return res.status(200).json({
                    loginIn: result[0].username,
                    expiresIn:'1 hour',
                    token:token
                })
            }
        });
    }else if(exp>=new Date()){
        return res.status(403).render('denied',{
            id: 'cert_expired_exception',
            message:`Your cert has expired according to utc time: \t exp time: ${exp}`
        });
    }  else if (cert.subject) {
        /*res.status(403)
            .send(`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`);*/
        return res.status(403).render('denied',{
            id: 'bad_cert_exception',
            message:`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`
        });
    }else {
        console.log(`You don't have a certificate, so create one! `);
        return res.status(401).render('denied',{
            id: 'no_cert_exception',
            message: `You don't have a certificate, so create one! REDIRECT IN 3 SEC`
        });
        /*res.status(401).render('createCert');*/
        /*res.status(401).redirect('/create');*/
        /*res.status(401).send("You need a cert");*/
    }
    /*
      res.render('index', { title: 'Express' });
    */
});

module.exports = router;