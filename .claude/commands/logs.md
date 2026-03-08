View live logs from the Azure App Service.

Stream logs in real-time:
```
az webapp log tail --name thavalam-app --resource-group thavalam-rg
```

If log streaming is not enabled, enable it first:
```
az webapp log config --name thavalam-app --resource-group thavalam-rg --application-logging filesystem --level information
```
