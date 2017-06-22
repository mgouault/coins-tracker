#!/bin/bash

currentDate=`date +%Y-%m-%d_%H-%M-%S`

nodeV8 tracker.js > logs/$currentDate.json
