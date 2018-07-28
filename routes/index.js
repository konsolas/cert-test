var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    const cert = req.socket.getPeerCertificate();
    const exp=new Date(cert.valid_to);
    if (req.client.authorized) {
        res.status(200).render('index',{subject: cert.subject.CN, issuer:cert.issuer.CN})
        /*res.status(200).send(`Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`);*/
        //返回token

    } else if (cert.subject) {
        /*res.status(403)
            .send(`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`);*/
        res.status(403).render('denied',{
            id: 'bad_cert_exception',
            message:`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`
        });
    }else if(exp>=new Date().toUTCString()){
        res.status(403).render('denied',{
            id: 'cert_expired_exception',
            message:`Your cert has expired according to utc time: \t exp time: ${exp}`
        });
    } else {
        console.log(`You don't have a certificate, so create one! `);
        res.status(401).render('denied',{
            id: 'no_cert_exception',
            message: `You don't have a certificate, so create one! `
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
