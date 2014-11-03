#!/bin/bash

pypid=0
watchpid=0

control_c()
# run if user hits control-c
{
  echo -en "\n*** Exiting ***\n"
  echo -en "Killing $pypid, $watchpid"
  kill $pypid
  kill $watchpid
  exit $?
}

# trap keyboard interrupt (control-c)
trap control_c SIGINT

python -m SimpleHTTPServer 8000 &
pypid=$!


watchify -t reactify js/main.js -o dist/bundle.js -d -v
watchpid=$!
 



