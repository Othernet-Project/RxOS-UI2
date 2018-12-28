#! /bin/sh

# generated messages formatted correctly for the api call
# time stamp (epoch time),srcname,message

num_days="$1"
num_lines="$2"
shift
shift

find "$@" -name '*.txt' -print0 | \
xargs -0 awk '{FS="/"; split(FILENAME,s); f=substr(s[length(s)],10,16); gsub("[_:-]"," ",f); print mktime(f " 00") "," s[length(s)-1] "," $0}'  | \
sort -nr -t , -k 1 | \
head -n "$num_lines"
