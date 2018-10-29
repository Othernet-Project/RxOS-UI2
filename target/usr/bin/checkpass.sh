#/bin/sh

un="$1"
pw="$2"
ent=$(cat /etc/shadow | grep "$un" | cut -d : -f 2)
salt=$(echo "$ent" | cut -d $ -f 3)

[[ -z "$salt" ]] && exit 1
[[ -z "$pw" ]] && exit 1

epw=$(mkpasswd -m sha-512 "$pw" "$salt")

[[ "$ent" == "$epw" ]] && echo "passwordCorrect"

