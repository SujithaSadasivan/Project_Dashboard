# PowerShell script to force restart the backend server
Write-Host "Stopping any process on port 8000..."

$port = 8000
$tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($tcp) {
    $pid_to_kill = $tcp.OwningProcess
    Write-Host "Found process ID: $pid_to_kill"
    Stop-Process -Id $pid_to_kill -Force
    Write-Host "Process killed."
} else {
    Write-Host "No process found on port 8000."
}

Write-Host "Starting Access Backend..."
cd backend
python -m uvicorn app.main:app --reload --port 8000
