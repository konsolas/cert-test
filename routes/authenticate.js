var express = require('express');
var router = express.Router();
router.get('/', (req, res) => {
    const cert = req.socket.getPeerCertificate();

    if (req.client.authorized) {
        res.send(`Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`);

    } else if (cert.subject) {
        res.status(403)
            .send(`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`);
    } else {
        console.log(`You don't have a certificate, so create one! `);
        res.status(401).render('createCert');
        /*res.status(401).send("You need a cert");*/
    }

});
module.exports=router;