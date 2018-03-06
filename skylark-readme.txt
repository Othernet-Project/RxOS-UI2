install build prerequisites:

sudo apt install jq npm nodejs-legacy
sudo npm install -g grunt

sudo ln -s $PWD/target_fs/etc/skylark_config.json /etc/skylark_config.json
sudo ln -s $PWD/target_fs/usr/lib/node_modules/skylark_config.js node_modules/skylark_config.js

now you can run:

./make_target_package.sh 

