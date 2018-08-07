const process=require('child_process');
const fs=require('fs');
const uuid=require('uuid/v1');
const query=require('./sql');
const certUtils=require('./certUtils');

//Pool initialization, will be used in www.
let initPool=async function(poolSize) {
    console.log('************initializing pool size='+poolSize+'**************');
    var size=poolSize;
    var unusedUsers=await query('SELECT * FROM users WHERE is_used=false');
    //Update unused users
    if(unusedUsers&&unusedUsers.length>0){
        size-=unusedUsers.length;
        unusedUsers.forEach(async(user)=>{
           var newPath=await certUtils.renewCert(user.uid);
           console.log('Renewed Cert: ',newPath);
        });
    }else{
        console.log('there is no existent unused users');
    }
    //create the new users
    console.log('creating ',size,' new users');
    for(var i=0; i<size; i++){
        var newUser=await certUtils.createUser();
        console.log('created user no '+newUser);
    }
    return 'initialized pool';
};
//every time u give a cert to a client, the cert goes to the "used" folder, and you update the pool.
let updatePoolWhenGivenCert=async function(){
    console.log('********Updating pool cuz Cert Given**********');
    var newUser=await certUtils.createUser();
    console.log('created user no '+newUser);
};
//scheduled task
let updatePool=async function() {
    let list=[];
    console.log('************Scheduled: Updating pool*************');
    //search for unused users
    var unused=await query('SELECT * FROM users WHERE is_used=false');
    if(unused&&unused.length>0){
        unused.forEach(async function(user){
            var newPath=await certUtils.renewCert(user.uid);
            list.push(user.uid);
            console.log('Renewed Cert for uid='+user.uid+' new path: '+newPath);
        });
    }
    //update them every day.
    return list;
};

module.exports.initPool=initPool;
module.exports.updatePoolWhenGivenCert=updatePoolWhenGivenCert;
module.exports.updatePool=updatePool;