const express = require('express');
const router = express.Router();
const secret = require('../public/javascripts/secret');
const query = require('../public/javascripts/sql');
const jwt = require('jsonwebtoken');
/* GET home page. */


router.get('/', async(req, res, next)=> {
    const cert = req.socket.getPeerCertificate();
    const exp=new Date(cert.valid_to);
    if (req.client.authorized) {
        //real
        var CN=cert.subject.CN;
        var serial=parseInt(cert.serialNumber,16).toString();
        console.log(`got the cert, CN: ${CN}, expiring at ${exp}, with a serial of ${serial}`);
        //Auth
        const authResult = await query(`SELECT * FROM users WHERE uuid="${CN}"`);
        console.log("query: "+`SELECT * FROM users WHERE uuid="${CN}"`);
        /*console.log("result: ",authResult.length<=0);*/
        if(authResult && authResult.length>0) {
            if(authResult[0].is_used===1 && authResult[0].cert_serial===serial){
                var username = authResult [0].username;
                console.log(`login by: ${username} at ${new Date()}`);
                console.log({subject: authResult [0].username, issuer: cert.issuer.CN, valid_to: cert.valid_to});
                //return token
                var token = jwt.sign({
                    uid: authResult [0].uid
                }, secret, {
                    expiresIn: "1h" //1h
                });
                /*!//send to the main page;
                res.status(200).render('index',{subject: authResult [0].username, issuer:cert.issuer.CN, valid_to: cert.valid_to});*/
                //send the json
                console.log(`generated the token ${token} with key ${secret}`);
                return res.status(200).json({
                    loginIn: authResult [0].username,
                    expiresIn: '1 hour',
                    token: token
                });
            } else if (authResult[0].is_used === 0) {
                return res.status(401).render('unauthorized', {
                    id: 'user_not_in_use_exception',
                    message: `Sorry, the user your cert is indicating is currently unused. Please contact your administrator for more information. `
                });
            } else if (authResult[0].cert_serial !== serial) {
                console.log('The cert serial does not correspond to the one in the database: it is an invalid cert. ');
                return res.status(401).render('unauthorized', {
                    id: 'invalid_cert_exception',
                    message: `Sorry, You are not successfully authenticated: your certificate is invalid.`
                });
            }
        }else{
            return res.status(401).render('unauthorized',{
                id: 'no_such_user_exception',
                message:`Sorry ${cert.subject.CN}, your account is non-existent or your cert is invalid. `
            });
        }
    } else if(exp>=new Date()){
        return res.status(401).render('unauthorized',{
            id: 'cert_expired_exception',
            message:`Please renew your cert: your cert has expired according to utc time: \t exp time: ${exp}`,
            CN:cert.subject.CN
        });
    } else if (cert.subject) {
        /*res.status(403)
            .send(`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`);*/
        return res.status(401).render('unauthorized',{
            id: 'bad_cert_exception',
            message:`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`
        });
    } else {
        console.log(`You don't have a certificate, so create one! `);
        return res.status(401).render('unauthorized',{
            id: 'no_cert_exception',
            message: `You don't have a certificate, so create one! `
        });
    }
});

module.exports = router;