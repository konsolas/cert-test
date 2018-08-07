const express = require('express');
const router = express.Router();
const process=require('child_process');
const fs=require('fs');
const async=require('async');
const uuid=require('uuid/v1');
const query=require('../public/javascripts/sql');
const certUtils=require('../public/javascripts/certUtils');
const certPool=require('../public/javascripts/certPool');

async function send(req,res,uid){
    if(uid!==0) {
        res.status(200).set({
            'Content-Type': "application/x-pkcs12",
            'Content-Disposition': 'certificate; filename=' + uid + '.p12'
        });
        res.write(fs.readFileSync('./client-ssl/' + uid + '.p12'));
        res.end();
        try{
            fs.renameSync('./client-ssl/'+uid+'_csr.pem', './client-ssl/used/'+uid+'_csr.pem');
            fs.renameSync('./client-ssl/'+uid+'_key.pem', './client-ssl/used/'+uid+'_key.pem');
            fs.renameSync('./client-ssl/'+uid+'_cert.pem', './client-ssl/used/'+uid+'_cert.pem');
            fs.renameSync('./client-ssl/'+uid+'.p12', './client-ssl/used/'+uid+'.p12');
        }catch(err){
            console.log(err);
        }
        await query(`UPDATE users SET cert="./client-ssl/used/${uid}.p12", is_used=true WHERE uid=${uid}`);
        console.log('query: ',`UPDATE users SET cert="./client-ssl/used/${uid}.p12", is_used=true WHERE uid=${uid}`);
        await certPool.updatePoolWhenGivenCert();
    }else{
        console.log('!!!!!!No unused User!!!!!!!');
    }
}

router.get('/', async(req,res)=>{
    var uid=await certUtils.getLastUnsuedUser();
    await send(req,res,uid);
});

module.exports=router;