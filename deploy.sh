#!/usr/bin/env bash

git pull

cd worker
rm -rf build
yarn install
yarn build

cd ../app
yarn install
rm -rf build
yarn build
yarn start