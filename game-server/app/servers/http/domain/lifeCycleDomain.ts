import services from '../../../services'
import {GmServer} from './manger'
import {pinus} from 'pinus'
import {GlobalEnum} from '../../../constants/global'

// 启动 http
export async function startupHttp() {
    await services.parameter.afterAppStartup()
    const myConfig = pinus.app.get(GlobalEnum.httpConfKey)['http'].filter((value: { id: string }) => {
        return value.id == pinus.app.serverId
    })
    if (myConfig.length > 0) {
        new GmServer().listen(myConfig[0].clientPort, myConfig[0].clientHost)
    } else {
        console.log('can not start http server, exit now')
        process.exit(1)
    }
}
