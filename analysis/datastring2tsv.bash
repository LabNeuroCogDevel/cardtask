#!/usr/bin/env bash
# pull data from psiturk hosted on heroku
# e.g.
#  ./datastring2tsv txt/datastring.json > output.tsv

#
# 20200410WF - init. here instead of Makefile b/c quoting jq string is painful
#            - also pipe to readraw.R for json unnsesting


# needs txt/datastring.json, see Makefile
[ -z "$1" -o ! -s "$1" ] && echo "USAGE: $0 datastring.json # from psiturk db" && exit 1

# header
echo "subjInfo subjID trial rt ignored picked side sym color key choice pts score" |
   sed 's/ /	/g'
# parse nested json
< $1 jq -r '
  . as $r |
  .data[0].trialdata.responses as $q |
  .data[] |
  .trialdata |
  select(.rt != null) |
  [$q, $r.workerId, .trial_index, .rt, .ignored, .picked, .side_idx, .sym, .color, .key_press, .p, .win, .score] |
  @tsv'

