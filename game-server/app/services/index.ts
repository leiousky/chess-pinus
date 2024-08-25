import * as fs from 'fs'
import * as path from 'path'
import AccountService from './account'
import ParameterService from './parameter'
import UserService from './user'
import UtilsService from './utils'
import CacheService from './cache'
import HttpService from './http'
import TimeService from './time'
import PaypalService from './paypal'
import ApiConvertService from './apiConvert'

export interface ServiceType {
    // 文件名：函数名
    account: AccountService
    parameter: ParameterService
    user: UserService
    utils: UtilsService
    cache: CacheService
    http: HttpService
    time: TimeService
    paypal: PaypalService
    apiConvert: ApiConvertService
}

// 导出 service 目录下的所有 service
let __service: ServiceType = null

function loadService() {
    if (!__service) {
        __service = {
            account: undefined,
            parameter: undefined,
            user: undefined,
            utils: undefined,
            cache: undefined,
            http: undefined,
            time: undefined,
            paypal: undefined,
            apiConvert: undefined,
        }
        const files = fs.readdirSync(__dirname).filter(
            filename => !filename.startsWith('index') && !filename.startsWith('base') && (filename.endsWith('.ts') || filename.endsWith('.js'))
        )

        const requires = {}
        files.map(f => {
            // 获取文件名
            const moduleName = path.basename(f, path.extname(f))
            requires[moduleName] = require(path.join(__dirname, f))
        })

        for (const k of Object.keys(requires)) {
            const mod = requires[k]
            if (mod.default) {
                // 使用 default 导出
                // FIXME 处理 static 函数调用
                if (mod.default instanceof Function) {
                    __service[k] = new mod.default()
                }
            } else {
                // 简单处理
                throw new Error('使用 default 导出 service')
            }
        }
        // 防止死循环调用
        Object.values(__service).forEach(service => {
            service.services = __service
        })
    }
    return __service
}

export default loadService()
