#!/usr/bin/env bash

git pull

cd worker
yarn install
yarn build

cd ../app
yarn install
yarn build
yarn start