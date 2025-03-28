@echo off
cd %~dp0
set NODE_OPTIONS=--max_old_space_size=4096
npx jest --no-cache --config=jest.config.cjs 