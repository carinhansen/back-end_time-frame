#!/bin/bash

set -e 

eval "$(ssh-agent -s)" # Start ssh-agent cache
chmod 600 .travis/id_rsa # Allow read access to the private key
ssh-add .travis/id_rsa # Add the private key to SSH

ssh -T travisci@bitesized.xyz <<EOF
  cd $DEPLOY_DIR
  ls
  echo $PASS | sudo -S git pull
  echo $PASS | sudo -S docker-compose stop
  echo $PASS | sudo -S docker-compose rm -f
  echo $PASS | sudo -S docker-compose build --no-cache
  echo $PASS | sudo -S docker-compose up -d
EOF

