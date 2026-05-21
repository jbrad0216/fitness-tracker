$projectDir = "C:\git\fitness-tracker"
$logFile = "$projectDir\overnight-log.txt"

$prompt = @"
Read TASKS.md and work through every task in order (Task 1 through Task 10).

IMPORTANT RULES:
1. After completing each task, print a clear status line exactly like this:
   ===== COMPLETED TASK [number]: [task name] =====
2. Run npm run build after each task to verify no errors
3. Commit with a descriptive message after each task
4. Push to GitHub after each commit: git push origin main
5. If a build fails, fix the errors before moving on
6. Do not stop until all 10 tasks are complete or you hit a limit
7. At the end, print: ===== ALL TASKS COMPLETE =====

Task summary for reference:
- Task 1: Settings/Profile page (editable targets, name, goals)
- Task 2: Editable workout templates (add/remove/reorder exercises)
- Task 3: Dashboard layout improvements (bigger rings, greeting, visual hierarchy)
- Task 4: Food logging UX (search, categories, undo, timestamps, copy yesterday)
- Task 5: Gym tab UX (rest timer, overload indicators, workout duration)
- Task 6: Stats improvements (projected goal date, streaks, personal records)
- Task 7: Onboarding flow for first-time users
- Task 8: Data persistence and backup system
- Task 9: Polish and micro-interactions (animations, haptics, error boundaries)
- Task 10: PWA performance and offline polish
"@

Set-Location $projectDir

$attempt = 1
$maxAttempts = 6
$waitMinutes = 60

while ($attempt -le $maxAttempts) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $message = "[$timestamp] Starting attempt $attempt of $maxAttempts"
    Write-Host $message -ForegroundColor Cyan
    Add-Content -Path $logFile -Value $message

    claude -p $prompt --dangerously-skip-permissions 2>&1 | Tee-Object -Append -FilePath $logFile

    # Check if all tasks completed
    $logContent = Get-Content $logFile -Raw
    if ($logContent -match "ALL TASKS COMPLETE") {
        $doneMsg = "[$timestamp] All tasks finished!"
        Write-Host $doneMsg -ForegroundColor Green
        Add-Content -Path $logFile -Value $doneMsg
        break
    }

    $attempt++
    if ($attempt -le $maxAttempts) {
        $waitMsg = "[$timestamp] Session ended. Waiting $waitMinutes minutes before retry..."
        Write-Host $waitMsg -ForegroundColor Yellow
        Add-Content -Path $logFile -Value $waitMsg
        Start-Sleep -Seconds ($waitMinutes * 60)
    }
}

Write-Host "Overnight run complete. Check overnight-log.txt for details." -ForegroundColor Green
