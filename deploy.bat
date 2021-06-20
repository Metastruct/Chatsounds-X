git pull

cd worker
call npm install
call npm run build

cd ../app
call npm install
call npm run build
call npm run start