# Rowan Grove IT

Website source and deployment files for [rowan-grove.com](https://rowan-grove.com).

## Structure

- `layouts/`, `static/`, and `hugo.toml`: editable Hugo source for the current small-business IT site.
- `public/`: pre-built production site deployed by Azure Static Web Apps.
- `api/`: Azure Functions contact-form API.
- `ContractingSite_Archive/`: complete backup of the previous contracting-focused site headed "Senior cloud engineering, without the full-time overhead."

## Local preview

Run `hugo server` from the repository root, then open the local URL Hugo prints.

## Production build

Run `hugo --cleanDestinationDir --minify` before committing. The Azure workflow deploys the pre-built `public/` folder and builds the API from `api/`.
