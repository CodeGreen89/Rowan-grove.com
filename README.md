# Rowan Grove

Static single-page website for Rowan Grove Technical Consultants.

## Local preview

Serve the repository root with any static HTTP server. There is no build step and no runtime dependency.

## Azure Static Web Apps

The included GitHub Actions workflow deploys the repository root whenever `main` changes.

1. In Azure, create a **Static Web App** and choose **Other** as the deployment source, because the deployment workflow is already included in this repository.
2. From the new Static Web App's overview page, select **Manage deployment token** and copy the token.
3. In the GitHub repository, add the token under **Settings → Secrets and variables → Actions** as a repository secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`.
4. Run the **Deploy to Azure Static Web Apps** workflow, or push a change to `main`.

The site requires no build command; `staticwebapp.config.json` supplies the production response headers.
