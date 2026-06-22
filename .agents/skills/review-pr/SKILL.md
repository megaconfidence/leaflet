---
name: review-pr
description: Review a pull request for code quality, correctness, security, scope, and documentation.
---

Given the PR number in the arguments:

1. Use `gh pr view <number> --json title,body,headRefName,baseRefName,files,additions,deletions` to fetch PR metadata
2. Use `gh pr diff <number>` to fetch the full diff
3. Run `npm run build` to check for compilation errors
4. Review the diff against the following categories:

### Issue Reference
- Check if the PR references an issue (e.g. "Closes #N", "Fixes #N", "Resolves #N" in the title or body)
- If no issue is referenced, note it as an `info`-level finding but do not block the PR

### Code Quality
- Compilation errors or type errors
- Dead code, unused imports, leftover debug statements (console.log, debugger)
- Adherence to existing code conventions and patterns in the codebase
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) — format: `<type>[optional scope]: <description>` (e.g. `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `perf:`, `ci:`, `build:`). If the PR title or commits deviate from this spec, note it as a `warning`.

### Correctness
- Does the PR actually address the issue it references?
- Are edge cases handled (null, undefined, empty inputs)?
- Potential bugs: race conditions, off-by-one errors, unhandled promises

### Security
- Secrets or tokens accidentally committed
- SQL injection, XSS, CSRF vulnerabilities
- Dangerous patterns (eval, innerHTML, unvalidated user input)

### Scope
- Is the diff minimal and focused on the issue?
- Are there unrelated changes that should be in a separate PR?
- Are there unnecessary files committed (dist/, node_modules/, .env, etc.)?

### Documentation
- Does the PR description explain what was changed and why?
- Is the README updated if the change affects setup or usage?
- Are comments needed for non-obvious logic?

### Version Bump
- Check if the PR includes a version bump in `package.json` (compare against `main` branch)
- If no version bump is present, run `npm version patch --no-git-tag-version`, commit with `chore: bump version`, and push to the PR branch
- This ensures CI publish won't fail when the PR is merged to `main`

5. Post a review using `gh pr review <number> --<verdict> --body "<review body>"` where:
   - `verdict` is `approve` if no critical issues or warnings were found
   - `verdict` is `request_changes` if any critical issues were found
   - `verdict` is `comment` if only warnings or info-level issues were found
6. The review body should include:
   - A summary of the review
   - A list of issues found with severity and category
   - Specific file/line references where applicable
   - For `request_changes`, clear instructions on what needs to be fixed

Important constraints:
- Do not attempt the same shell command more than once. If a command fails, move on.
- If `gh pr review` fails, still return the review data in the result.
- Keep the review concise and actionable.
- Be constructive, not dismissive.
