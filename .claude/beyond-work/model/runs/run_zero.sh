#!/bin/bash
# the zero-poverty costing on the paper's three household calibrations (seed 20261016), three at a time
cd "$(dirname "$0")/.."
for cal in central rec075 tilt17; do
  python3 -I optionb_zero.py --seed 20261016 --cal $cal --out runs/zero_${cal}_20261016.json > runs/zero_${cal}_20261016.log 2>&1 &
done
wait
