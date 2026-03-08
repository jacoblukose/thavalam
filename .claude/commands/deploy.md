Manual deploy to Azure App Service.

Steps:
1. Run `npm run build` to build the production bundle
2. Create a zip: `zip -r /tmp/thavalam-deploy.zip dist/ node_modules/ package.json`
3. Deploy to Azure: `az webapp deploy --name thavalam-app --resource-group thavalam-rg --src-path /tmp/thavalam-deploy.zip --type zip`
4. Verify the app is running at thavalam-app.azurewebsites.net

Azure details:
- App name: thavalam-app
- Resource group: thavalam-rg
- Region: Central India
- App Service Plan: thavalam-plan
