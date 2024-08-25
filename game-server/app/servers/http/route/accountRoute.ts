import * as express from 'express'
import services from '../../../services'
import errorCode from '../../../constants/errorCode'
import {pinus} from 'pinus'
import {GlobalEnum} from '../../../constants/global'
import {LoginRet, RegisterRet} from '../../../types/http/accountRoute'
import {LoginPlatform} from '../../../constants/game'
import {HydratedDocument} from 'mongoose'
import {IAccountModel} from '../../../dao/models/account'

// 账号
export const accountRoute = express.Router()

// 注册
accountRoute.post('/register', register)
// 登录
accountRoute.post('/login', login)
// 重置密码
accountRoute.post('/resetPasswordByPhone', resetPasswordByPhone)

// 注册
async function register(req: any, res: any) {
    // 账号信息
    const account: string = req.body.account || ''
    // 密码
    const password: string = req.body.password || ''
    // 登录平台
    const loginPlatform: number = Number(req.body.loginPlatform) || LoginPlatform.none
    // 销售 id
    const spreaderId: string = req.body.spreaderID || ''
    // 短信验证码
    const smsCode: string = req.body.smsCode || ''
    // 手机区号
    const areaCode: string = req.body.areaCode || '86'
    const isValidParams = services.account.checkAccountAndPassword(account, password, loginPlatform)
    if (!isValidParams) {
        return res.end(RegisterRet.error(errorCode.invalidRequest))
    }
    const isAuthPhone = pinus.app.get(GlobalEnum.publicParameterKey).authPhone
    if (isAuthPhone) {
        // TODO 检查短信
        if (!smsCode) {
            return res.end(RegisterRet.error(errorCode.smsCodeErr))
        }
    }
    const model = await services.account.registerAccount(account, password, loginPlatform, spreaderId, areaCode)
    if (!model) {
        // 注册失败
        return res.end(RegisterRet.error(errorCode.getHallFail))
    }
    const msg = services.account.dispatchServers(pinus.app.getServersByType('connector'), model.uid)
    if (msg) {
        return res.end(RegisterRet.ok(msg))
    } else {
        return res.end(RegisterRet.error(errorCode.getHallFail))
    }
    // 调用其它 remoter 接口
    // const resp = await pinus.app.rpc.game.harvestRemoter.enter.to(serverId2)(uid)
}

async function login(req: any, res: any) {
    // 账号信息
    const account: string = req.body.account || ''
    // 密码
    const password: string = req.body.password || ''
    // 登录平台
    const loginPlatform: number = Number(req.body.loginPlatform) || LoginPlatform.none
    // 短信验证码
    const captcha: string = req.body.captcha
    // 手机区号
    const areaCode: string = req.body.areaCode || '86'
    if (!account || !password || !loginPlatform) {
        return res.end(LoginRet.error(errorCode.invalidRequest))
    }
    let model: HydratedDocument<IAccountModel>
    switch (loginPlatform) {
        case LoginPlatform.mobilePhone:
            model = await services.account.getAccountByPhone(account, areaCode, captcha)
            break
        case LoginPlatform.account:
            model = await services.account.getAccountByPassword(account, password)
            break
        default:
            return res.end(LoginRet.error(errorCode.invalidRequest))
    }
    if (!model) {
        return res.end(LoginRet.error(errorCode.invalidAccountOrPassword))
    }
    const msg = services.account.dispatchServers(pinus.app.getServersByType('connector'), model.uid)
    if (msg) {
        res.end(LoginRet.ok(msg))
    } else {
        res.end(LoginRet.error(errorCode.getHallFail))
    }
}

async function resetPasswordByPhone(req: any, res: any) {

}
