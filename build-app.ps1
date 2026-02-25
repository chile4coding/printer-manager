# Simple build script to create installer
Write-Host "Building Printer Manager installer..."

# Clean old builds
Remove-Item -Path ".\out" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\dist" -Recurse -Force -ErrorAction SilentlyContinue

# Run Electron Forge make  
& npm run make

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!"
    Write-Host "Installers available in: ./out/make/"
    Get-ChildItem "./out/make/" -Recurse | Where-Object { $_.Extension -eq ".exe" }
} else {
    Write-Host "Build failed!"
}
