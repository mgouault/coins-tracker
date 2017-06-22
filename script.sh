#!/bin/bash

currentDate=`date +%Y-%m-%d_%H-%M-%S`

~/.nvm/versions/node/v8.1.2/bin/node tracker.js > logs/$currentDate.json
