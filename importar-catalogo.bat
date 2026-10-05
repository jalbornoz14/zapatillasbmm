@echo off
title Importar catalogo BMM
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0importar-catalogo.ps1" %*
echo.
pause
