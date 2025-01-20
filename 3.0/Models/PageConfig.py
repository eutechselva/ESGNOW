import clr
import System
import ServiceDesk
import BaseModel
import Newtonsoft
import Newtonsoft.Json.Linq as JSON

xstr = ServiceDesk.Common.ConvertToString
xint = ServiceDesk.Common.ConvertToInt

class Model(BaseModel.Model):
    def __init__(self, *args):
        BaseModel.Model.__init__(self,*args)

    def ExecuteSavePageConfig(self, args, env):

        route = xstr(args['Route'])

        res = self.account.DBService().ExecuteQuery('SELECT * FROM UMSPageConfigs WHERE [Route]=@route',{'route':route})
        if res.Rows.Count == 0:
            return self.dbmodel.Create(self.account,args,env)
        else: 

            params = {
                "Key": xstr(res.Rows[0]['Key']),
                "Configuration": xstr(args['Configuration'])
            }
            return self.dbmodel.Update(self.account, params, env)

            
            