var express = require('express');
var router = express.Router();
var process=require('child_process');
function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};
router.post('/', (req,res,next)=>{
    //get the name
    var name=req.body.name;
    var email=req.body.email;
    console.log("create user: ",name);
    //输入进database: Name, Associate 1个CA_ID
    /**/
    var CA_ID=1;
    //创建证书
    /*process.execFile('/client_cert_creation.sh',['-i',CA_ID],null,function (err, stdout, stderr){
        console.log(err, stdout,stderr);
        if(!err&&!stderr)res.status(200).send('Success');
        else res.status(500).send('failed');
    });*/
    process.exec('openssl req -newkey rsa:4096 -keyout '+CA_ID+'_key.pem -out '+CA_ID+'_csr.pem -nodes -days 365 -subj "/CN='+CA_ID+'"',null,function(err,stdout,stderr){
        if((!err&&!stderr)||(err==""&&stderr=="")) {
            console.log('openssl req -newkey rsa:4096 -keyout '+CA_ID+'_key.pem -out '+CA_ID+'_csr.pem -nodes -days 365 -subj "/CN='+CA_ID+'"');
        }
        else {
            console.log(err,stderr);
        }
    });
    sleep(1000);
    //sign
    process.exec('openssl x509 -req -in '+CA_ID+'_csr.pem -CA server_cert.pem -CAkey server_key.pem -out '+CA_ID+'_cert.pem -set_serial 01 -days 365',null,function(err,stdout,stderr){
        if((!err&&!stderr)||(err==""&&stderr=="")) {
            console.log('openssl x509 -req -in '+CA_ID+'_csr.pem -CA server_cert.pem -CAkey server_key.pem -out '+CA_ID+'_cert.pem -set_serial 01 -days 365');
        }
        else {
            console.log(err,stderr);
        }
    });
    sleep(1000);
    //转换为浏览器可识别的pkcs12格式
    process.exec('openssl pkcs12 -export -clcerts -in '+CA_ID+'_cert.pem -inkey '+CA_ID+'_key.pem -out '+CA_ID+'.p12 -nodes',null,function(err,stdout,stderr){
        if((!err&&!stderr)||(err==""&&stderr=="")) {
            console.log('openssl pkcs12 -export -clcerts -in '+CA_ID+'_cert.pem -inkey '+CA_ID+'_key.pem -out '+CA_ID+'.p12 -nodes');
        }
        else {
            console.log(err,stderr);
        }
    });

    //转换到浏览器可浏览的格式

    //发送证书：下载？email?

    res.status(401).send("Success")
});

module.exports=router;