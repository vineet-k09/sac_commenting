#!/bin/sh

cat _secrets/sa-key.json | docker --config .docker-prod login -u _json_key --password-stdin https://europe-west3-docker.pkg.dev