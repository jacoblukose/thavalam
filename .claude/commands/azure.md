Manage the Azure App Service for Thavalam.

Azure details:
- App name: thavalam-app
- Resource group: thavalam-rg
- Region: Central India
- App Service Plan: thavalam-plan
- URL: https://thavalam-app.azurewebsites.net

Common commands:
- Check app status: `az webapp show --name thavalam-app --resource-group thavalam-rg --query "{state:state, defaultHostName:defaultHostName}"`
- View logs: `az webapp log tail --name thavalam-app --resource-group thavalam-rg`
- Restart app: `az webapp restart --name thavalam-app --resource-group thavalam-rg`
- List app settings: `az webapp config appsettings list --name thavalam-app --resource-group thavalam-rg`
- Set an app setting: `az webapp config appsettings set --name thavalam-app --resource-group thavalam-rg --settings KEY=VALUE`
- View deployment logs: `az webapp log deployment show --name thavalam-app --resource-group thavalam-rg`
