#!/usr/bin/env bash

CA_ID="";

while getopts "i:" arg
do
    case $arg in
        i)
            CA_ID=$OPTARG
            ;;
        ?)
        echo "含有未知参数"
    exit 1 ;;
    esac
done
openssl req -newkey rsa:4096 -keyout ${CA_ID}_key.pem -out CA_ID_csr.pem -nodes -days 365 -subj "/CN=${CA_ID}"
openssl x509 -req -in ${CA_ID}_csr.pem -CA server_cert.pem -CAkey server_key.pem -out ${CA_ID}_cert.pem -set_serial 01 -days 365 -nodes
openssl pkcs12 -export -clcerts -in ${CA_ID}_cert.pem -inkey ${CA_ID}_key.pem -out ${CA_ID}.p12 -nodes