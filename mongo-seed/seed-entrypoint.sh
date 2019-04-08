#! /bin/bash

#ls -1 *.json | while read jsonfile; do mongoimport --drop --host mongo --db twh --file $jsonfile --jsonArray --type json; done;


ls -1 *.json | sed 's/.json$//' | while read col; do 
    mongoimport --drop --host mongo --db twh --jsonArray -c $col < $col.json; 
done

mongo --host mongo ./schema.js

echo 'all db ready'
