@echo off
REM ============================================
REM  setup-video.bat — Lancer dans le dossier du projet
REM  Fait tout : pochette Deezer + sync Whisper + apply
REM ============================================

echo.
echo === SETUP VIDEO AUTOMATIQUE ===
echo.

REM Step 1: Install npm deps if needed
if not exist node_modules (
    echo [1/5] Installation des dependances npm...
    call npm install
) else (
    echo [1/5] Dependances npm OK
)

REM Step 2: Check audio file
if not exist public\audio.mp3 (
    echo.
    echo ERREUR: Place ton fichier audio.mp3 dans le dossier public\ avant de lancer ce script
    pause
    exit /b 1
)
echo [2/5] Audio trouve: public\audio.mp3

REM Step 3: Fetch cover from Deezer
echo [3/5] Recuperation pochette Deezer...
call npx tsx scripts/fetch-cover.ts "Autobahn" "SCH" "cover.jpg"
if %errorlevel% neq 0 (
    echo ATTENTION: Pochette non recuperee, ajoute cover.jpg manuellement dans public\
)

REM Step 4: Whisper sync
echo [4/5] Synchronisation audio avec Whisper...
python scripts/whisper-sync.py public/audio.mp3 "[\"Ghini-Lambo', 47 AK, j'sors de la caisse sape comme un MAC\",\"Tu veux m'faire le chaud? Tu vas voir la claque\",\"Tu veux faire la course? Tu vas voir qu'la plaque, gang\",\"Que c'est bouche sur Rabateau\",\"D-deux-quarante dans la L2, outille comme Takeshi Kitano\"]" > sync-result.json 2>sync-log.txt

if %errorlevel% neq 0 (
    echo ATTENTION: Whisper sync a echoue. Verifie sync-log.txt
    type sync-log.txt
) else (
    echo Sync reussi!
    type sync-log.txt
)

REM Step 5: Apply sync to video JSON
echo [5/5] Application des timings au JSON...
if exist sync-result.json (
    python scripts/apply-sync.py src/data/autobahn.json sync-result.json
)

echo.
echo === TERMINE ===
echo Lance maintenant: npx remotion studio
echo.
pause
