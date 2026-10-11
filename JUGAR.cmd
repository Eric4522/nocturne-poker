@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
if not exist dist call npm run build
start "" http://localhost:3017
node server.js
