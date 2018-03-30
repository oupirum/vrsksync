# vrsksync

Sync utility.

Works via Firebase, so can be used to sync files over network without static IPs.

Usage: 
  - On host (source):
  
    $ node vrsksync send <my_token> <my_directory>
    
    // So all changed files in this this directory will be sent to remote
  
  - On remote (dest):
  
    $ node vrsksync receive <my_token> <my_directory>
    
    // So changed files from host will be updated here (token must be same on host and on remote)


Setup:
  
  For private usage setup your own Firebase and
  add credentials to the config.json:
  
    ...
    "auth": {
      "anonymous": false,
      "email": "myemail@gmail.com",
      "password": "qqqqqqq"
    }
  
  If you decide to use anonymous mode you can specify you own secret phrase
  for checking MD5 hashsum (to prevent malicious replacement of data):
  
    "hashSecret": "fewfeght-my-phrase",
    "auth": {
      ...
