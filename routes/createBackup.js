var express = require('express');
var router = express.Router();
var process=require('child_process');
var fs=require('fs');
function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};
router.post('/', (req,res,next)=>{
    //get the name
    var name=req.body.name;
    var email=req.body.email;
    console.log("create user: ",name);
    var isSuccess=true;
    //输入进database: Name, Associate 1个CA_ID
    /**/
    var CA_ID=3;
    //创建证书
    /*process.execFile('/client_cert_creation.sh',['-i',CA_ID],null,function (err, stdout, stderr){
        console.log(err, stdout,stderr);
        if(!err&&!stderr)res.status(200).send('Success');
        else res.status(500).send('failed');
    });*/
    sleep(500);
    process.exec('openssl req -newkey rsa:4096 -keyout '+CA_ID+'_key.pem -out '+CA_ID+'_csr.pem -nodes -days 365 -subj "/CN='+CA_ID+'"',null,function(err,stdout,stderr){
        if((!err&&!stderr)||(err==""&&stderr=="")) {
            console.log('openssl req -newkey rsa:4096 -keyout '+CA_ID+'_key.pem -out '+CA_ID+'_csr.pem -nodes -days 365 -subj "/CN='+CA_ID+'"');
        }
        else {
            console.log(err,stderr);
        }
    });
    sleep(500);
    //sign
    process.exec('openssl x509 -req -in '+CA_ID+'_csr.pem -CA server_cert.pem -CAkey server_key.pem -out '+CA_ID+'_cert.pem -set_serial 01 -days 365',null,function(err,stdout,stderr){
        if((!err&&!stderr)||(err==""&&stderr=="")) {
            console.log('openssl x509 -req -in '+CA_ID+'_csr.pem -CA server_cert.pem -CAkey server_key.pem -out '+CA_ID+'_cert.pem -set_serial 01 -days 365');
        }
        else {
            console.log(err,stderr);
        }
    });
    sleep(500);
    //转换为浏览器可识别的pkcs12格式
    process.exec('openssl pkcs12 -export -clcerts -in '+CA_ID+'_cert.pem -inkey '+CA_ID+'_key.pem -out '+CA_ID+'.p12 -password pass:',null,function(err,stdout,stderr){
        if((!err&&!stderr)||(err==""&&stderr=="")) {
            console.log('openssl pkcs12 -export -clcerts -in '+CA_ID+'_cert.pem -inkey '+CA_ID+'_key.pem -out '+CA_ID+'.p12 -password pass:');
        }
        else {
            console.log(err,stderr);
        }
    });
    sleep(500);
    //放进ssl文件夹
    fs.rename('./'+CA_ID+'.p12', './client-ssl/'+CA_ID+'.p12', (err)=>{
        if(err&err!=""){
            console.log(err);
        }
    });
    sleep(500);
    fs.rename('./'+CA_ID+'_cert.pem', './client-ssl/'+CA_ID+'_cert.pem', (err)=>{
        if(err&err!=""){
            console.log(err);
            isSuccess=false;
        }
    });
    sleep(500);
    fs.rename('./'+CA_ID+'_csr.pem', './client-ssl/'+CA_ID+'_csr.pem', (err)=>{
        if(err&err!=""){
            console.log(err);
            isSuccess=false;
        }
    });
    sleep(500);
    fs.rename('./'+CA_ID+'_key.pem', './client-ssl/'+CA_ID+'_key.pem', (err)=>{
        if(err& err!=""){
            console.log(err);
            isSuccess=false;
        }
    });
    //发送证书：下载？email?
    sleep(2000);
    if(isSuccess) {
        console.log('success');
        res.status(200).set({
            'Content-Type':"application/x-pkcs12",
            'Content-Disposition': 'certificate; filename='+CA_ID+'.p12'
        });
        res.write(fs.readFileSync('./client-ssl/'+CA_ID+'.p12'));
        res.end();
    }else{
        res.status(403).send("Not Successful");
    }
});
/*router.get('/success', function(req,res,next){
   res.setHeader('Content-Type', 'text/html');
   res.write('Please import the cert and then restart the browser. ');
   res.end();
});*/

module.exports=router;