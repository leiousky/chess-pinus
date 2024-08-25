import * as express from 'express'
import * as cors from 'cors'
import {accountRoute} from '../route/accountRoute'
import * as path from 'path'
import {pinus} from 'pinus'

export class GmServer {
    expressApp: any

    constructor() {
        this.expressApp = express()
    }

    listen(port: number, host: string) {
        // 允许跨域
        this.expressApp.use(cors())
        // 支持 json
        this.expressApp.use(express.json())
        // 解析 application/x-www-form-urlencoded
        this.expressApp.use(express.urlencoded({extended: true}))
        // 设置静态目录
        this.expressApp.use(express.static(path.join(pinus.app.getBase(), 'app', 'public')))
        this.setRoute()
        console.log(`http server listening on  ${host}:${port}`)
        this.expressApp.listen(port, host)
    }

    setRoute() {
        // 账号
        this.expressApp.use('/', accountRoute)
    }
}


