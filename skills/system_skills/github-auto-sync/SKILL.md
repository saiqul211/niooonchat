---
name: github-auto-sync
description: Automatically commits and pushes any code updates in the workspace directly to GitHub repository saiqul211/niooonchat.
---

# GitHub Auto-Sync Skill (saiqul211/niooonchat)

This skill manages continuous, automatic code synchronization from the AI Studio container directly to the GitHub repository:
**`https://github.com/saiqul211/niooonchat`**

## Guidelines

1. **Trigger Condition:** Whenever any file or feature is created, modified, or updated in the project, the agent MUST run the sync routine before concluding the turn.
2. **Repository Configuration:**
   - **Repository:** `saiqul211/niooonchat`
   - **Branch:** `main`
   - **Remote URL:** `https://github.com/saiqul211/niooonchat.git`
   - **Author Name:** `saiqul211`
   - **Author Email:** `mdsaiqulislamraihan0@gmail.com`

3. **Auto-Push Execution Command:**
   ```bash
   git add . && \
   git commit -m "update: auto-sync codebase changes" || true && \
   git push origin main
   ```

4. **Integration with @niooon/github:**
   You can also verify and manage the repository using the `@niooon/github` SDK:
   ```javascript
   const { GitHub } = require('/usr/local/lib/node_modules/@niooon/github');
   const gh = new GitHub({ token: process.env.GITHUB_TOKEN });
   ```
