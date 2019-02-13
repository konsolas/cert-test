const process=require('child_process');
const fs=require('fs');
const uuidV1=require('uuid/v1');
/*const uuidV4=require('uuid/v4');*/
const query=require('./sql');

let createCert=function(uid,useruuid,root){
    console.log('**********Creating cert for uid='+uid+' ******************');
    var certSerial=uid.toString()+new Date().getTime();
    try {
        //Create Key and CSR
        process.execSync(`openssl req -newkey rsa:4096 -keyout ${uid}_key.pem -out ${uid}_csr.pem -nodes -days 365 -subj "/CN=${useruuid}"`);
        console.log(`Executing: openssl req -newkey rsa:4096 -keyout ${uid}_key.pem -out ${uid}_csr.pem -nodes -days 365 -subj "/CN=${useruuid}"`);
        //Sign the cert
        process.execSync(`openssl x509 -req -in ${uid}_csr.pem -CA server_cert.pem -CAkey server_key.pem -out ${uid}_cert.pem -set_serial ${certSerial} -days 365`);
        console.log(`Executing: openssl x509 -req -in ${uid}_csr.pem -CA server_cert.pem -CAkey server_key.pem -out ${uid}_cert.pem -set_serial ${certSerial} -days 365`);
        //Package the cert to p12
        process.execSync(`openssl pkcs12 -export -clcerts -in ${uid}_cert.pem -inkey ${uid}_key.pem -out ${uid}.p12 -password pass:`);
        console.log(`Executing: openssl pkcs12 -export -clcerts -in ${uid}_cert.pem -inkey ${uid}_key.pem -out ${uid}.p12 -password pass:`);
        //Move the files (you can change the code to delete the .pem files that are actually useless
        console.log('moving the files');
        fs.renameSync('./'+uid+'_csr.pem', root+uid+'_csr.pem');
        fs.renameSync('./'+uid+'_key.pem', root+uid+'_key.pem');
        fs.renameSync('./'+uid+'_cert.pem', root+uid+'_cert.pem');
        fs.renameSync('./'+uid+'.p12', root+uid+'.p12');
        console.log('file moved');
    }catch(err){
        console.log(err);
    }
    return certSerial;
};
let createUser=async function() {
    console.log('***********Creating random new User*************');
    var useruuid=uuidV1();
    useruuid=useruuid.replace(/\-/g,'');
    console.log("uuid of the new user: "+useruuid);
    await query(`INSERT INTO users (uuid,creation_date) VALUES ("${useruuid}", now())`);
    await query(`UPDATE users SET username=concat("user",uid) WHERE uuid="${useruuid}"`);
    var user=await query(`SELECT * FROM users WHERE uuid="${useruuid}"`);
    var uid=user[0].uid;
    var username=user[0].username;
    console.log("uid: ",uid,"Username: ", username);
    var certSerial=await createCert(uid,useruuid,'./client-ssl/');
    var path='./client-ssl/'+uid+'.p12';
    await query(`UPDATE users SET cert="${path}", cert_serial="${certSerial}" WHERE uid=${uid}`);
    console.log(`query: UPDATE users SET cert="${path}", cert_serial="${certSerial}" WHERE uid=${uid}`);
    return uid;
};
//async function to renew the cert
let renewCert=async function(uid) {
    console.log('**************Renewing the Cert for uid='+uid+' ****************');
    var user;
    var queryResult=await query(`SELECT * FROM users WHERE uid=${uid}`);
    if(queryResult&&queryResult.length>0){
        user={
            uid:uid,
            uuid:queryResult[0].uuid,
            cert:queryResult[0].cert,
            isUsed:queryResult[0].is_used
        }
    }else{
        return null;
    }
    var root;
    if(user.isUsed===1){
        root='./client-ssl/used/';
        console.log('root is: ', root);
    }else{
        root='./client-ssl/';
        console.log('root is: ',root);
    }
    var certSerial=await createCert(uid,user.uuid,root);
    //update the database and put the new serial in it
    await query(`UPDATE users SET cert_serial="${certSerial}" WHERE uid=${uid}`);
    console.log(`query: UPDATE users SET cert_serial="${certSerial}" WHERE uid=${uid}`);
    return root+uid+'.p12'; //return the path
};
//sync function to renew the cert
let renewCertUuid=async function(uuid) {
    console.log('**************Renewing the Cert for uuid='+uuid+' ****************');
    var user;
    var queryResult=await query(`SELECT * FROM users WHERE uuid="${uuid}"`);
    if(queryResult&&queryResult.length>0){
        user={
            uid:queryResult[0].uid,
            uuid:uuid,
            cert:queryResult[0].cert,
            isUsed:queryResult[0].is_used
        }
    }else{
        return null;
    }
    var root;
    if(user.isUsed===1){
        root='./client-ssl/used/';
        console.log('root is: ', root);
    }else{
        root='./client-ssl/';
        console.log('root is: ',root);
    }
    var certSerial=await createCert(user.uid,user.uuid,root);
    //update the database and put the new serial in it
    await query(`UPDATE users SET cert_serial="${certSerial}" WHERE uuid="${uuid}"`);
    console.log(`query: UPDATE users SET cert_serial="${certSerial}" WHERE uuid="${uuid}"`);
    return root+user.uid+'.p12'; //return the path
};

let getLastUnusedUser=async function() {
    console.log('***************Getting last Unused user to distribute*****************');
    var unusedUsers=await query('SELECT * FROM users WHERE is_used=false');
    console.log('query: '+'SELECT * FROM users WHERE is_used=false');
    if(unusedUsers&&unusedUsers.length>0){
        console.log('Got '+ unusedUsers[0].uid);
        return unusedUsers[0].uid;
    }else{
        return 0;
    }
};
module.exports.createCert=createCert;
module.exports.createUser=createUser;
module.exports.renewCert=renewCert;
module.exports.renewCertUuid=renewCertUuid;
module.exports.getLastUnsuedUser=getLastUnusedUser;


