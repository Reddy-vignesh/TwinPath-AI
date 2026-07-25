$projectRoot = 'c:\Users\vighn\Documents\mine\Decision Ai Twin'
$dest = Join-Path $projectRoot 'TwinPath_AI_Judge_Submission.zip'
$tempDir = Join-Path $env:TEMP 'TwinPath_Workspace_Zip'

if (Test-Path $dest) { Remove-Item $dest -Force }
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

$exclude = @('node_modules', '.venv', 'venv', '__pycache__', '.git', 'dist', 'build', '.env', 'TwinPath_AI_Judge_Submission.zip')

Get-ChildItem -Path $projectRoot | ForEach-Object {
    if ($exclude -notcontains $_.Name) {
        Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force
    }
}

# Create .env.example
$envExample = Join-Path $tempDir 'backend\.env.example'
Set-Content -Path $envExample -Value "APP_ENV=development`nAPP_DEBUG=true`nPOSTGRES_HOST=localhost`nPOSTGRES_PORT=5432`nPOSTGRES_USER=decisiontwin`nPOSTGRES_PASSWORD=changeme`nPOSTGRES_DB=decisiontwin_db`nDATABASE_URL=postgresql+asyncpg://decisiontwin:changeme@localhost:5432/decisiontwin_db`nJWT_SECRET_KEY=super-secret-key-for-local-development-only-12345678901234567890`nCORS_ORIGINS=http://localhost:5173,http://localhost:3000"

Compress-Archive -Path "$tempDir\*" -DestinationPath $dest -Force
Remove-Item $tempDir -Recurse -Force

Write-Host "SUCCESS: Created $dest"
