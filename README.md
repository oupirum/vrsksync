# vrsksync

Sync utility

Usage: 
  - On host (source):
  
    $ node host.js username my_project_dir
    
    // So all changed files in this this folder will be sended to remote
  
  - On remote:
  
    $ node client.js username my_project_remote_dir
    
    // So changed files from host will be updated here (username must be same on host and on client).
    
    my_project_dir - absolute path
    
