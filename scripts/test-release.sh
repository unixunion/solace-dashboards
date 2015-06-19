#!/bin/bash

./release.py -e prod -p ProdProduct -v 1.4 -c 100 -s "Release Request Pending"
./release.py -e qa1 -p QAproduct -v 1.2 -c 200 -s "Release Request Verified"
./release.py -e qa1 -p QACas -v 2.4 -c 301 -s  "Verifying Infrastructure"
./release.py -e dev -p devproduct -v 2.4 -c 303 -s  "Taking down pool members"
./release.py -e prod -p Customer-Utils -v 2.4 -c 501 -s  "Error Verifying Infrastructure"
