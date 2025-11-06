## DevHabit / Blog System

A full-stack app with a .NET 9 Web API and a React (Vite) client. Includes CI/CD workflows for API deployment to Azure App Service and static client hosting.

### Monorepo Structure

```
DeployingFinal/
  DevHabit/                # .NET solution
    DevHabit.Api/          # ASP.NET Core Web API
    DevHabit.UnitTests/    # Unit tests
    DevHabit.IntegrationTests/
    DevHabit.FunctionalTests/
  client/
    devhabit-ui/           # React (Vite) client
  .github/workflows/       # CI/CD pipelines
```

### Prerequisites

- .NET SDK 9.x
- Node.js 18+ and npm
- Azure resources (for CI/CD):
  - App Service publish profile (API)
  - Database connection string (PostgreSQL)

### Local Development

- API
  - From repo root: `cd DeployingFinal/DevHabit`
  - Restore/build: `dotnet restore DevHabit.sln && dotnet build DevHabit.sln -c Debug`
  - Run: `dotnet run --project DevHabit.Api`

- Client
  - From repo root: `cd DeployingFinal/client/devhabit-ui`
  - `npm install`
  - `npm run dev`

Configure API base URL in `client/devhabit-ui/src/api/config.ts` if needed.

### Database Migrations

Migrations are organized under:
- `DevHabit/DevHabit.Api/Migrations/Application`
- `DevHabit/DevHabit.Api/Migrations/Identity`

Create/update locally (examples):
```
cd DeployingFinal/DevHabit
dotnet ef migrations add SomeChange --project DevHabit.Api --startup-project DevHabit.Api --context ApplicationDbContext --output-dir Migrations/Application
dotnet ef migrations add SomeIdentityChange --project DevHabit.Api --startup-project DevHabit.Api --context ApplicationIdentityDbContext --output-dir Migrations/Identity
```

Apply locally:
```
dotnet ef database update --project DevHabit.Api --startup-project DevHabit.Api --context ApplicationDbContext
dotnet ef database update --project DevHabit.Api --startup-project DevHabit.Api --context ApplicationIdentityDbContext
```

### CI/CD Overview

CI/CD is handled via GitHub Actions workflows in `.github/workflows/`.

#### API Pipeline: `build-and-deploy-api.yml`

- Triggers:
  - On push to `main` affecting `DevHabit/**`
  - Manual `workflow_dispatch`

- Global env of interest:
  - `WORKING_DIRECTORY=DevHabit`
  - `SOLUTION_PATH=DevHabit.sln`
  - `API_PROJECT_PATH=DevHabit.Api`
  - `AZURE_WEBAPP_PACKAGE_PATH=./DevHabit/DevHabit.Api/publish`
  - `PUBLISH_DIR=./publish` (relative to `WORKING_DIRECTORY`)

- Jobs
  1) Build and Test (Ubuntu)
     - Checkout, setup .NET 9.x
     - `dotnet restore DevHabit.sln`
     - `dotnet build DevHabit.sln -c Release --no-restore`
     - `dotnet test DevHabit.sln -c Release --no-restore --no-build --verbosity normal`
     - Publish API to a deterministic folder:
       - `dotnet publish DevHabit.Api -c Release --no-restore --no-build --property:PublishDir=${{ env.PUBLISH_DIR }}`
       - Artifacts uploaded from `./DevHabit/DevHabit.Api/publish` (repo-root relative)

  2) Apply Database Migrations (Ubuntu)
     - Installs `dotnet-ef` tool
     - Creates two migration bundles (self-contained executables):
       - `dotnet ef migrations bundle --startup-project DevHabit.Api --project DevHabit.Api --context ApplicationDbContext --output app-bundle.exe`
       - `dotnet ef migrations bundle --startup-project DevHabit.Api --project DevHabit.Api --context ApplicationIdentityDbContext --output identity-bundle.exe`
     - Executes bundles against the production database:
       - `./app-bundle.exe --connection "${{ secrets.DATABASE_CONNECTION_STRING }}"`
       - `./identity-bundle.exe --connection "${{ secrets.DATABASE_CONNECTION_STRING }}"`

  3) Deploy (Ubuntu)
     - Downloads `webapp` artifact into `AZURE_WEBAPP_PACKAGE_PATH`
     - Deploys via `azure/webapps-deploy@v2` using publish profile

- Required GitHub Secrets
  - `AZURE_WEBAPP_PUBLISH_PROFILE`: Azure App Service publish profile XML
  - `DATABASE_CONNECTION_STRING`: Connection string for EF migration bundles

- Common Pitfalls & Fixes
  - Artifact not found: ensure `dotnet publish` outputs to the path expected by `AZURE_WEBAPP_PACKAGE_PATH`.
  - EF bundle startup-project error: use `--startup-project DevHabit.Api` (working dir is `DevHabit`) or point to `DevHabit.Api/DevHabit.Api.csproj` explicitly.

#### Client Pipeline: `build-and-deploy-client.yml`

- Typical steps (summary):
  - Setup Node, install, build (`npm ci && npm run build`)
  - Produce `dist/` artifact
  - Deploy to your static hosting (Azure Static Web Apps or other), per workflow configuration

### iOS Mobile Rendering Note

The blog detail page uses Tiptap. To avoid iOS Safari white-screen crashes from invalid JSON content, the editor initialization safely parses content and falls back to an empty document. If you change the content source to HTML or non-JSON strings, ensure conversion before passing to the editor.

### Environment Configuration

API settings live in `DevHabit.Api/appsettings.json` and environment-specific files. Provide production settings via Azure App Service application settings or environment variables as needed.

### License

MIT