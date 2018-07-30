var express = require('express');
var router = express.Router();
var process=require('child_process');
var fs=require('fs');
var async=require('async');
var uuid=require('uuid/v1');
var mysql=require('mysql');
var serverConfig=require('../public/javascripts/serverConfig');
let sleep=function(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};
router.get('/', (req,res,next)=>{
    //get the ca_id
    var CN_ID=0;
    var useruuid;
    var username;
    //创建证书
    /*process.execFile('/client_cert_creation.sh',['-i',CN_ID],null,function (err, stdout, stderr){
        console.log(err, stdout,stderr);
        if(!err&&!stderr)res.status(200).send('Success');
        else res.status(500).send('failed');
    });*/
    var connection = mysql.createConnection(serverConfig);

    async.series([
        function(callback){
            //Create user and give him a random uuid, username, date.
            useruuid=uuid();
            useruuid=useruuid.replace(/\-/g,'');
            console.log("uuid of the new user: "+useruuid);
            connection.connect();
            connection.query(`INSERT INTO users (uuid,creation_date) VALUES ("${useruuid}", now())`, function (err,result){
                if(err)console.log(err);
                console.log("query: "+`INSERT INTO users (uuid,creation_date) VALUES ("${useruuid}", now())`);
            });
            connection.query(`UPDATE users SET username=concat("user",uid) WHERE uuid="${useruuid}"`,function (err,result){
                if(err) console.log(err);
                console.log("query: "+`UPDATE users SET username=concat("user",uid) WHERE uuid="${useruuid}"`);
            });
            connection.query(`SELECT * FROM users WHERE uuid="${useruuid}"`,function(err,result){
                if(err) console.log(err);
                console.log("query: "+`SELECT * FROM users WHERE uuid="${useruuid}"`);
                if(!result||result===""){
                    console.log("not Found");
                }else{
                    CN_ID=result[0].uid;
                    username="user"+CN_ID;
                    console.log("CN_ID: ",CN_ID,"Username: ", username);
                    callback(null,`generated the uuid: ${useruuid}, done setting up the user: ${username}, uid: ${CN_ID}`);
                }
            });
        },
        function(callback){
            //Create Key and CSR
            try {
                process.execSync('openssl req -newkey rsa:4096 -keyout ' + CN_ID + '_key.pem -out ' + CN_ID + '_csr.pem -nodes -days 365 -subj "/CN=' + useruuid + '"');
                console.log('Executing: '+'openssl req -newkey rsa:4096 -keyout ' + CN_ID + '_key.pem -out ' + CN_ID + '_csr.pem -nodes -days 365 -subj "/CN=' + useruuid + '"');
            }catch(err){
                console.log(err);
            }
            while(!fs.existsSync('./'+CN_ID+'_key.pem')||!fs.existsSync('./'+CN_ID+'_csr.pem')){
                sleep(100);
            }
            /*sleep(1000);*/
            callback(null, 'Creating Key and CSR');
        },
        function(callback){
            //Sign the cert
            try{
                process.execSync('openssl x509 -req -in '+CN_ID+'_csr.pem -CA server_cert.pem -CAkey server_key.pem -out '+CN_ID+'_cert.pem -set_serial 01 -days 365');
                console.log('Executing: '+'openssl x509 -req -in '+CN_ID+'_csr.pem -CA server_cert.pem -CAkey server_key.pem -out '+CN_ID+'_cert.pem -set_serial 01 -days 365');
            }catch(err){
                console.log(err);
            }
            while(!fs.existsSync('./'+CN_ID+'_cert.pem')){
                sleep(100);
            }
            /*sleep(1000);*/
            callback(null, 'signing the cert');
        },
        function(callback){
            //Package the cert to p12
            try {
                process.execSync('openssl pkcs12 -export -clcerts -in ' + CN_ID + '_cert.pem -inkey ' + CN_ID + '_key.pem -out ' + CN_ID + '.p12 -password pass:');
                console.log('Executing: '+'openssl pkcs12 -export -clcerts -in ' + CN_ID + '_cert.pem -inkey ' + CN_ID + '_key.pem -out ' + CN_ID + '.p12 -password pass:')
            }catch(err){
                console.log(err);
            }
            while(!fs.existsSync('./'+CN_ID+'.p12')){
                sleep(100);
            }
            /*sleep(1000);*/
            callback(null, 'packing up the cert');

        },
        //Move the files
        function(callback){
            fs.rename('./'+CN_ID+'_csr.pem', './client-ssl/'+CN_ID+'_csr.pem', (err)=>{
                if(err&&err!==""){
                    console.log(err);
                }
            });
            callback(null, 'first file moved');
        },
        function(callback){
            fs.rename('./'+CN_ID+'_key.pem', './client-ssl/'+CN_ID+'_key.pem', (err)=>{
                if(err&&err!==""){
                    console.log(err);
                }
            });
            callback(null, 'second file moved');
        },
        function(callback){
            fs.rename('./'+CN_ID+'_cert.pem', './client-ssl/'+CN_ID+'_cert.pem', (err)=>{
                if(err&&err!==""){
                    console.log(err);
                }
            });
            callback(null, 'third file moved');

        },
        function(callback){
            fs.rename('./'+CN_ID+'.p12', './client-ssl/'+CN_ID+'.p12', (err)=>{
                if(err&&err!==""){
                    console.log(err);
                }
            });
            callback(null, 'last file moved');

        },
        function(callback){
            //Save the path of the cert
            var path='./client-ssl/'+CN_ID+'.p12';
            connection.query(`UPDATE users SET cert="${path}" WHERE uid=${CN_ID}`,function(err,result){
                if(err) console.log(err);
                console.log("query: "+ `UPDATE users SET cert="${path}" WHERE uid=${CN_ID}`);
            });
            callback(null, 'saved the path');
        },
        function(callback){
            while(!fs.existsSync('./client-ssl/'+CN_ID+'.p12')){
                sleep(100);
            }
            res.status(200).set({
                'Content-Type': "application/x-pkcs12",
                'Content-Disposition': 'certificate; filename=' + CN_ID + '.p12'
            });
            res.write(fs.readFileSync('./client-ssl/' + CN_ID + '.p12'));
            res.end();
            callback(null,'END OF THE SHIT');
        }
    ],function(err, results){
        if(err) throw err;
        //The results: sending it to the user;
        console.log(results);
        connection.end();
    });

});
/*router.get('/success', function(req,res,next){
   res.setHeader('Content-Type', 'text/html');
   res.write('Please import the cert and then restart the browser. ');
   res.end();
});*/

module.exports=router;