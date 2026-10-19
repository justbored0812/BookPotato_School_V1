# BookPotato Port Cleanup Utility
# This script finds and terminates any processes listening on port 5000 (Server) or port 5173 (Vite HMR)

$ports = @(5001, 5173)

foreach ($port in $ports) {
    Write-Host "Checking port $port..." -ForegroundColor Cyan
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    
    if ($connections) {
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            try {
                $process = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Found process '$($process.Name)' (PID: $procId) on port $port. Terminating..." -ForegroundColor Yellow
                    Stop-Process -Id $procId -Force
                    Write-Host "Successfully terminated process $procId." -ForegroundColor Green
                }
            } catch {
                Write-Host "Failed to terminate process $procId. You might need to run this as Administrator." -ForegroundColor Red
            }
        }
    } else {
        Write-Host "Port $port is clear." -ForegroundColor Gray
    }
}

Write-Host "`nAll specified ports are now free. You can restart your server." -ForegroundColor Cyan
