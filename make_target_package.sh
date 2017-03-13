#! /bin/bash

set -e
set -u

# example configuration
# grunt config:get --name="client.ReloadOnShutdown"
# grunt config:set --name="client.ReloadOnShutdown" --value=true

# check if skylark_config.json is properly formatted
echo "checking json config"
jq --slurp empty /etc/skylark_config.json


if type npm 2>&1 | grep -q "not found"
then
    echo install npm first
    echo sudo apt install npm
fi

if type grunt 2>&1 | grep -q "not found"
then
    echo install grunt-cli first
    echo npm install -g grunt-cli
fi

# clean up dist
rm -rf dist dist-dev

# install node modules
npm install --production

# build
grunt --target=dist
grunt

[ -d target ] && rm -rf target
mkdir target
mkdir -p target/usr/share/www
mkdir -p target/usr/lib/node_modules/ui2/server
for i in Broadway Draw  MusicPlayer  ProcessViewer  Settings  Textpad
do
    rm -rf "dist/packages/default/$i"
done
rm dist/api.php

cp -a dist/* target/usr/share/www
rm target/usr/share/www/packages/*/*/api.*
cp -a src/server/node/* target/usr/lib/node_modules/ui2/server
cp src/server/*.json target/usr/lib/node_modules/ui2/

# copy over api files
for i in src/packages/*/*/api.js
do
    mkdir -p target/usr/share/$(dirname $i)
    cp "$i" target/usr/share/$(dirname $i)
done

rm -rf target/usr/share/src/packages/default/Broadway target/usr/share/src/packages/default/Settings
rm -rf target/usr/lib/node_modules/ui2/server/handlers/demo target/usr/lib/node_modules/ui2/server/handlers/pam target/usr/lib/node_modules/ui2/server/handlers/mysql

# copy over additional target code
cp -a target_fs/* target/

# fix dist name
sed -i 's/"dist"/"www"/' target/usr/lib/node_modules/ui2/packages.json

# generate list of modules required on target
# this is required by buildroot
mod=$(grep -r "require("  src/server/node target_fs/usr/lib/node_modules | cut -d : -f 2 | tr ',' '\n' | sed "s/.*require('\([a-z_A-Z0-9-]*\)').*/\1/"  | grep -v '^ ' | sort | uniq | tr '\n' ' ')

echo buildroot nodejs modules config:
echo \"$mod\"
echo "$mod" > required_modules.target

echo you may need to make the following links:
echo '   ln -s $PWD/target_fs/etc/skylark_config.json /etc/skylark_config.json'
echo '   ln -s $PWD/target_fs/usr/lib/node_modules/skylark_config.js node_modules/skylark_config.js'

echo run with:
echo 'node target/usr/lib/node_modules/ui2/server/server.js www --root  $PWD/target/usr/share/'
