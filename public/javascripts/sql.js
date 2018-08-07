const mysql = require('mysql');
const serverConfig=require('./serverConfig');
const pool = mysql.createPool(serverConfig);
let query=function(sql,values){
    return new Promise((resolve, reject)=>{
        pool.getConnection(function(err,connection){
            if(err){
                reject(err);
            }else{
                connection.query(sql,values,(err,rows)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(rows);
                    }
                    connection.release();
                });
            }
        });
    });
};
module.exports=query;
