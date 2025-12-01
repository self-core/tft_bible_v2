Write-Host "Building TFT Bible microservices..." -ForegroundColor Green

# Change to the microservices directory
Set-Location "C:\Users\puppets\Documents\tft_bible_v2\microservices"

# Build the entire workspace
Write-Host "Building workspace..." -ForegroundColor Yellow
cargo build --release

# Check if build succeeded
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    
    # Check if Docker is available
    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerCmd) {
        Write-Host "Docker is available. Building services with Docker..." -ForegroundColor Yellow
        
        # Build Docker containers
        docker-compose build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker build completed successfully!" -ForegroundColor Green
            
            Write-Host "To start the services, run: docker-compose up" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Docker build failed." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Docker not found. Built services locally only." -ForegroundColor Yellow
        Write-Host "To run services:" -ForegroundColor Cyan
        Write-Host "  1. Ensure MongoDB is running" -ForegroundColor Cyan
        Write-Host "  2. Run each service individually with 'cargo run --release'" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Build failed." -ForegroundColor Red
    exit 1
}