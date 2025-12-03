# Policies Portal

This repository contains the modular React-based policies portal. The current branch is `work` with no Git remotes configured yet.

## Linking to GitHub
If you want to push this code to GitHub (for example, to `https://github.com/GLCV319/policies`), add the remote and push the current branch:

```bash
git remote add origin https://github.com/GLCV319/policies.git
git push -u origin work
```

After adding the remote, `git remote -v` will show the configured URLs, and future `git push` commands will publish changes to GitHub.

## Can the assistant push directly?
No. This environment does not have your GitHub credentials or SSH keys, so the assistant cannot push changes for you. You control whether and where to publish by configuring the remote and running `git push` yourself.
