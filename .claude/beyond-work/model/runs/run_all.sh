#!/bin/bash
# runs the eight remaining household configurations, three at a time
cd "$(dirname "$0")/.."
jobs_list=()
for cal in central rec075 tilt17; do for seed in 20261016 20261029 20261031; do
  [ "$cal" = central ] && [ "$seed" = 20261016 ] && continue
  jobs_list+=("$cal $seed")
done; done
run() { python3 -I optionb_hh.py --seed $2 --cal $1 --full --years --out runs/$1_$2.json > runs/$1_$2.log 2>&1; }
i=0
for j in "${jobs_list[@]}"; do
  run $j &
  i=$((i+1))
  if [ $((i % 3)) -eq 0 ]; then wait; fi
done
wait
echo ALLDONE > runs/ALLDONE
