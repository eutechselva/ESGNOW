from Newtonsoft.Json import JsonConvert
from System.IO import File
from System.Collections.Generic import Dictionary
from System.Collections.Generic import List

def GetAllApps(args):
    apps = []
    for app in  Account.GetAllApps():
         # Skip hidden apps
        if app.Name in Account.HiddenApps:
            continue
        # Skip apps without "dashboard" in their menus
        if "dashboard" not in app.Menus:
            continue
        
        apps.append({
            'name': app.Name, 
            'longName': app.LongName,
            'icon': '/Resources/'+app.Name+'/AppIcon.svg',
            'homepage': '/Apps/'+app.Name+'/dashboard'
        })

    return apps