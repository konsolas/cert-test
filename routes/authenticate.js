var express = require('express');
var router = express.Router();
router.get('/', (req, res) => {
    const cert = req.socket.getPeerCertificate();
    const exp=new Date(cert.valid_to);
    if (req.client.authorized) {
        res.status(200).send(`Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`);
        //返回token

    } else if (cert.subject) {
        res.status(403)
            .send(`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`);
    }else if(exp>=new Date().toLocaleDateString()){
        res.status(403).send("Your cert has expired");
    } else {
        console.log(`You don't have a certificate, so create one! `);
        res.status(401).render('createCert');
        /*res.status(401).send("You need a cert");*/
    }

});
module.exports=router;