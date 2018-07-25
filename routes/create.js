var express = require('express');
var router = express.Router();
var process=require('child_process');
var fs=require('fs');
var async=require('async');
let sleep=function(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};
router.post('/', (req,res,next)=>{
    //get the name
    var name=req.body.name;
    var email=req.body.email;
    console.log("create user: ",name, email);
    var isSuccess=true;
    var callback=function () {};
    //输入进database: Name, Associate 1个CA_ID
    /**/
    var CA_ID=2;
    //创建证书
    /*process.execFile('/client_cert_creation.sh',['-i',CA_ID],null,function (err, stdout, stderr){
        console.log(err, stdout,stderr);
        if(!err&&!stderr)res.status(200).send('Success');
        else res.status(500).send('failed');
    });*/

    async.series([
        function(callback){
            //Create Key and CSR
            process.exec('openssl req -newkey rsa:4096 -keyout '+CA_ID+'_key.pem -out '+CA_ID+'_csr.pem -nodes -days 365 -subj "/CN='+CA_ID+'"',null,function(err,stdout,stderr){
                console.log(err,stderr);
            });
            while(!fs.existsSync('./'+CA_ID+'_key.pem')||!fs.existsSync('./'+CA_ID+'_csr.pem')){
                sleep(100);
            }
            /*sleep(1000);*/
            callback(null, 'Creating Key and CSR');
        },
        function(callback){
            //Sign the cert
            process.exec('openssl x509 -req -in '+CA_ID+'_csr.pem -CA server_cert.pem -CAkey server_key.pem -out '+CA_ID+'_cert.pem -set_serial 01 -days 365', null,function(err,stdout,stderr){
                console.log(err,stderr);
            });
            while(!fs.existsSync('./'+CA_ID+'_cert.pem')){
                sleep(100);
            }
            /*sleep(1000);*/
            callback(null, 'signing the cert');
        },
        function(callback){
            //Package the cert to p12
            process.exec('openssl pkcs12 -export -clcerts -in '+CA_ID+'_cert.pem -inkey '+CA_ID+'_key.pem -out '+CA_ID+'.p12 -password pass:',null,function(err,stdout,stderr){
                console.log(err,stderr);
            });
            while(!fs.existsSync('./'+CA_ID+'.p12')){
                sleep(100);
            }
            /*sleep(1000);*/
            callback(null, 'packing up the cert');

        },
        function(callback){
            fs.rename('./'+CA_ID+'_csr.pem', './client-ssl/'+CA_ID+'_csr.pem', (err)=>{
                if(err&err!=""){
                    console.log(err);
                    isSuccess=false;
                }
            });
            callback(null, 'first file moved');
        },
        function(callback){
            fs.rename('./'+CA_ID+'_key.pem', './client-ssl/'+CA_ID+'_key.pem', (err)=>{
                if(err& err!=""){
                    console.log(err);
                    isSuccess=false;
                }
            });
            callback(null, 'second file moved');
        },
        function(callback){
            fs.rename('./'+CA_ID+'_cert.pem', './client-ssl/'+CA_ID+'_cert.pem', (err)=>{
                if(err&err!=""){
                    console.log(err);
                    isSuccess=false;
                }
            });
            callback(null, 'third file moved');

        },
        function(callback){
            fs.rename('./'+CA_ID+'.p12', './client-ssl/'+CA_ID+'.p12', (err)=>{
                if(err&err!=""){
                    console.log(err);
                    isSuccess=false;
                }
            });
            callback(null, 'last file moved');

        },
        function(callback){
            while(!fs.existsSync('./client-ssl/'+CA_ID+'.p12')){
                sleep(100);
            }
            res.status(200).set({
                'Content-Type': "application/x-pkcs12",
                'Content-Disposition': 'certificate; filename=' + CA_ID + '.p12'
            });
            res.write(fs.readFileSync('./client-ssl/' + CA_ID + '.p12'));
            res.end();
            callback(null,'END OF THE SHIT');
        }
    ],function(err, results){
        if(err) throw err;
        //The results: sending it to the user;
        console.log(results);
    });

});
/*router.get('/success', function(req,res,next){
   res.setHeader('Content-Type', 'text/html');
   res.write('Please import the cert and then restart the browser. ');
   res.end();
});*/

module.exports=router;