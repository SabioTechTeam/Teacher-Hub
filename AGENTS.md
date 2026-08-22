# Agent Workflow & Collaboration Guidelines

## 🛑 STRICT RULE: Local Testing & Approval First

All AI agents working on the Teacher-Hub project MUST adhere to the following rules:

1. **NO Automatic GitHub Pushes or PR Merges:**
   - Do NOT run `git push`, open PRs, or merge PRs to remote branches automatically.
   - All code edits, file creations, and fixes must be developed and validated **locally first**.

2. **Local Validation:**
   - Verify that the local dev server (`http://localhost:3000`) and API (`http://localhost:8000`) compile cleanly with 0 TypeScript/runtime errors.
   - Test that navigation and connectors work smoothly end-to-end.

3. **Present Changes to the User for Local Testing:**
   - Tell the user what was changed and instruct them to test it in their local browser.
   - Wait for the user's explicit instructions and approval before committing, pushing, or opening PRs to GitHub.
