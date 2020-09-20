const express=require('express');
const router=express.Router();
const fs=require('fs');
const certUtils=require('../utils/certUtils');
router.get(`/:uuid`,(req,res,next)=>{
    //renew the cert for a user.
    var useruuid=req.params.uuid.replace(':','');
    console.log('uuid: ',req.params.uuid.replace(':',''));
    certUtils.renewCertUuid(useruuid)
        .then(resultPath=>{
            console.log(resultPath);
            var fileName=resultPath.replace('./client-ssl/used/','');
            res.status(200).set({
                'Content-Type': "application/x-pkcs12",
                'Content-Disposition': 'certificate; filename=' + fileName
            });
            res.write(fs.readFileSync(resultPath));
            res.end();
        })
        .catch(err=>{
            console.error(err);
        })
    ;

});
module.exports=router;