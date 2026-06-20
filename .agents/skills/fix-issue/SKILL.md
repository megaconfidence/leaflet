---
name: fix-issue
description: Analyze a GitHub issue, reproduce it, apply a fix, and open a pull request.
---

Given the issue number in the arguments:

1. Use `gh issue view <number>` to fetch the issue title and body
2. Read the relevant parts of the codebase to understand the area
3. Identify the root cause of the issue
4. Write a concise diagnosis of the problem
5. Create a new branch named `fix/issue-<number>`
6. Apply the minimal fix needed to resolve the issue
7. Run `npm run build` to verify the changes compile
8. If the build fails, iterate on the fix until it passes (max 3 attempts)
9. Commit the changes with a clear message referencing the issue (e.g. `fix: resolve #<number> — <short description>`)
10. Push the branch
11. Open a pull request using `gh pr create` with:
    - Title: `fix: resolve #<number>`
    - Body: include the diagnosis, what was changed, and `Closes #<number>`
12. Return the PR URL

Important constraints:
- Set git identity before committing: `git config user.email "actions@github.com" && git config user.name "github-actions[bot]"`
- If `gh pr create` fails, do NOT retry or try alternative methods. Set `fix_applied` to `true`, set `pr_url` to the empty string, and note the failure in the diagnosis. The branch is already pushed and ready for manual PR creation.
- Do not attempt the same shell command more than once. If a command fails, move on.
- If the issue cannot be reproduced or the fix is too complex, set `fix_applied` to `false` and explain why in the diagnosis.
