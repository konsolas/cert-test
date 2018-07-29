var express = require('express');
var router = express.Router();
var mysql= require('mysql');
/* GET home page. */
router.get('/', function(req, res, next) {
    const cert = req.socket.getPeerCertificate();
    const exp=new Date(cert.valid_to);
    const connection = mysql.createConnection({
        host: 'localhost',//主机地址
        user: 'root',//登录名
        password: '123456',//密码，我这里是空
        database: 'platformdb'//数据库
    });
    connection.connect();
    if (req.client.authorized) {
        console.log(`got the cert, CN: ${cert.subject.CN}, expiring at ${exp}`);
        //Auth
        console.query(`SELECT * FROM users WHERE uuid="${cert.subject.CN}"`,function(err,result){
            if(err) console.log(err);
            console.log("query"+`SELECT * FROM users WHERE uuid="${cert.subject.CN}"`);
            if(result&&result!==""){
                console.log(`login by: ${result[0].username} at ${new Date()}`);
                res.status(200).render('index',{subject: result[0].username, issuer:cert.issuer.CN, valid_to: cert.valid_to});
            }
        })
        // Testing code: if(exp>new Date()) console.log('true');

        /*res.status(200).send(`Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`);*/
        //返回token

    }else if(exp>=new Date()){
        res.status(403).render('denied',{
            id: 'cert_expired_exception',
            message:`Your cert has expired according to utc time: \t exp time: ${exp}`
        });
    }  else if (cert.subject) {
        /*res.status(403)
            .send(`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`);*/
        res.status(403).render('denied',{
            id: 'bad_cert_exception',
            message:`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`
        });
    }else {
        console.log(`You don't have a certificate, so create one! `);
        res.status(401).render('denied',{
            id: 'no_cert_exception',
            message: `You don't have a certificate, so create one! Please wait for about 5 secs`
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
