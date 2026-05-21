$projectDir = "C:\git\fitness-tracker"
$logFile = "$projectDir\overnight-log-phase2.txt"

$prompt = @"
Read TASKS-PHASE2.md and work through every task in order (Task 1 through Task 8).

CRITICAL RULES — SELF-HEALING:
- After EVERY file edit, run npm run build immediately
- If the build fails, DO NOT move on. Fix the error right away.
- If you cannot fix an error after 3 attempts, REVERT the breaking change with git checkout on the affected files, then try a different approach
- If a feature requires an external dependency, install it with npm install BEFORE using it
- If an API call fails or an external service is unavailable, implement a graceful fallback (e.g., manual entry instead of API search)
- If you hit an import error, check that all file paths and export names are correct
- If a component crashes, wrap it in a try-catch or error boundary
- NEVER commit broken code. Every commit must pass npm run build.
- If something is fundamentally not working after multiple attempts, skip that sub-feature, add a TODO comment, and move on to the next task. Do not get stuck on one problem.

PROGRESS REPORTING — FREQUENT UPDATES:
Print status updates constantly so the user can see progress. Use this exact format:

At the START of each task:
>>> STARTING TASK [number]: [task name]

At each major sub-step within a task:
  >> Working on: [specific thing you are doing right now]
  Example: >> Working on: Creating settings page component with editable fields
  Example: >> Working on: Wiring up USDA API search with debounced input
  Example: >> Working on: Fixing build error in FoodTab.jsx — missing import

After each successful build:
  >> BUILD PASSED ✓

After each commit and push:
  >> PUSHED TO GITHUB ✓

After completing a task:
===== COMPLETED TASK [number]: [task name] =====

If fixing an error:
  >> ERROR DETECTED: [description]
  >> FIXING: [what you are doing to fix it]
  >> FIX APPLIED — rebuilding...

Print these updates generously. More updates is better. The user is watching the terminal overnight and wants to see constant activity.

WORKFLOW PER TASK:
1. Print >>> STARTING TASK
2. Read the task requirements from TASKS-PHASE2.md
3. Plan the implementation (print what you plan to do)
4. Implement step by step, printing >> Working on: for each step
5. Run npm run build after each file change
6. If build fails, fix immediately and print the error/fix
7. When task is complete, commit and push
8. Print ===== COMPLETED TASK =====
9. Move to next task

Do not stop until all 8 tasks are complete or you hit a usage limit.
At the very end, print: ===== ALL TASKS COMPLETE =====

Task summary:
- Task 1: Cloud storage setup wizard (export/import to Google Drive, iCloud, Box, OneDrive)
- Task 2: Food database search with USDA/OpenFoodFacts API auto-fill nutrition data
- Task 3: Mobile-optimized UI overhaul (larger fonts, touch targets, iOS-native feel, safe areas)
- Task 4: Exercise library with descriptions, YouTube video links, muscle group tags, SVG illustrations
- Task 5: AI chat interface for natural language logging (pattern matching parser)
- Task 6: Progress journey visualization (week timeline, milestones, streaks, celebrations)
- Task 7: General mobile UX improvements (swipe nav, pull-to-refresh, quick-log shortcuts, reminders)
- Task 8: Error handling and robustness (error boundaries, data validation, offline indicator)
"@

Set-Location $projectDir

$attempt = 1
$maxAttempts = 6
$waitMinutes = 60

while ($attempt -le $maxAttempts) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $message = "[$timestamp] ============ ATTEMPT $attempt OF $maxAttempts ============"
    Write-Host $message -ForegroundColor Cyan
    Add-Content -Path $logFile -Value $message

    claude -p $prompt --dangerously-skip-permissions 2>&1 | Tee-Object -Append -FilePath $logFile

    # Check if all tasks completed
    $logContent = Get-Content $logFile -Raw
    if ($logContent -match "ALL TASKS COMPLETE") {
        $doneMsg = "[$( Get-Date -Format 'yyyy-MM-dd HH:mm:ss' )] ALL TASKS FINISHED!"
        Write-Host $doneMsg -ForegroundColor Green
        Add-Content -Path $logFile -Value $doneMsg
        break
    }

    # Show what was completed so far
    $completedTasks = ([regex]::Matches($logContent, "COMPLETED TASK (\d+)")).Count
    $statusMsg = "[$( Get-Date -Format 'yyyy-MM-dd HH:mm:ss' )] Session ended. $completedTasks of 8 tasks completed so far."
    Write-Host $statusMsg -ForegroundColor Yellow
    Add-Content -Path $logFile -Value $statusMsg

    $attempt++
    if ($attempt -le $maxAttempts) {
        $waitMsg = "[$( Get-Date -Format 'yyyy-MM-dd HH:mm:ss' )] Waiting $waitMinutes minutes before retry $attempt..."
        Write-Host $waitMsg -ForegroundColor Yellow
        Add-Content -Path $logFile -Value $waitMsg

        # Countdown timer so the user sees it's alive
        for ($i = $waitMinutes; $i -gt 0; $i--) {
            Write-Host "`r  Resuming in $i minutes...  " -NoNewline -ForegroundColor DarkGray
            Start-Sleep -Seconds 60
        }
        Write-Host ""
    }
}

$finalMsg = "[$( Get-Date -Format 'yyyy-MM-dd HH:mm:ss' )] Overnight run complete. Check overnight-log-phase2.txt for full details."
Write-Host $finalMsg -ForegroundColor Green
Add-Content -Path $logFile -Value $finalMsg
