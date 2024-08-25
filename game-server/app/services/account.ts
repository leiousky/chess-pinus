import BaseService from './base'
import {LoginPlatform} from '../constants/game'
import * as config from '../../config'
// FIXME 删除兼容旧版本, 新版本使用 import * as bcrypt from 'bcrypt'
import * as bcrypt from 'bcrypt-nodejs'
import {accountModel} from '../dao/models/account'
import {newUid} from '../dao/models/idCounter'
import {ServerInfo} from 'pinus'
import {dispatch} from '../util/dispatcher'
import * as token from '../util/token'

// 账号
export default class AccountService extends BaseService {
    constructor() {
        super()
    }

    // 检查账号登录参数
    checkAccountAndPassword(account: string, password: string, loginPlatform: LoginPlatform): boolean {
        if (!account || !password || !loginPlatform) {
            return false
        }
        if (loginPlatform == LoginPlatform.account) {
            // 密码登录
            return account.length <= config.account.maxAccountLen && password.length <= config.account.maxPasswordLen
        } else if (loginPlatform == LoginPlatform.mobilePhone) {
            // TODO 检查手机号
            return account.length == 11 && password.length <= config.account.maxPasswordLen
        } else if (loginPlatform == LoginPlatform.weiXin) {
            return true
        }
        return false
    }

    // 注册账号, 不使用明文密码
    registerAccount(account: string, password: string, loginPlatform: LoginPlatform, spreaderId: string, areaCode: string) {
        if (!this.checkAccountAndPassword(account, password, loginPlatform)) {
            return null
        }
        if (!areaCode) {
            // 默认为 86
            areaCode = '86'
        }
        switch (loginPlatform) {
            case LoginPlatform.account:
                return this.registerByPassword(account, password, spreaderId)
            case LoginPlatform.mobilePhone:
                return this.registerByPhone(account, areaCode, spreaderId)
            default:
                return null
        }
    }

    // 根据用户名，密码注册
    async registerByPassword(account: string, password: string, spreaderId: string) {
        const oldAccount = await accountModel.findOne({account})
        if (oldAccount) {
            // 不是第一次登录
            const isOk = await this.isValidPassword(password, oldAccount.password)
            if (!isOk) {
                // 密码错误
                return null
            }
            return oldAccount
        } else {
            // 新建
            const hashPasswd = await this.generateHash(password, config.account.saltRound)
            return this.newAccount(account, hashPasswd, '', '', '', spreaderId)
        }
    }

    // 通过手机号登录
    async registerByPhone(phone: string, areaCode: string, spreaderId: string) {
        const oldAccount = await accountModel.findOne({phoneAccount: phone})
        if (oldAccount) {
            // 不是第一次登录
            return oldAccount
        } else {
            return this.newAccount('', '', phone, '', areaCode, spreaderId)
        }
    }

    // 新建账号
    async newAccount(account: string, password: string, phoneAccount: string, wxAccount: string, areaCode: string, spreaderId: string) {
        const uid = await newUid()
        const newAccount = new accountModel({
            account,
            password,
            phoneAccount,
            wxAccount,
            spreaderID: spreaderId,
            areaCode,
            uid,
        })
        await newAccount.save()
        return newAccount
    }

    generateHash(plainPassword: string, saltRound: number) {
        return bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(saltRound))
    }

    isValidPassword(password: string, hash: string) {
        return bcrypt.compareSync(password, hash)
    }

    dispatchServers(servers: ServerInfo[], uid: number) {
        if (!servers || servers.length === 0) {
            return null
        }
        const connector = dispatch(uid.toString(), servers)
        return {
            serverInfo: {
                host: connector.clientHost,
                port: connector.clientPort
            },
            token: token.createToken(uid, connector.id),
        }
    }

    // 根据 uid 获取 account
    async getAccountByUid(uid: number) {
        return accountModel.findOne({uid})
    }

    // 通过手机号登录
    async getAccountByPhone(phone: string, areaCode: string, captcha: string) {
        const model = await accountModel.findOne({phoneAccount: phone, areaCode})
        // TODO 检查验证码
        return model
    }

    // 通过密码登录
    async getAccountByPassword(account: string, password: string) {
        const model = await accountModel.findOne({account})
        if (!model) {
            return null
        }
        const isValid = this.isValidPassword(password, model.password)
        if (!isValid) {
            // 密码错误
            return null
        }
        return model
    }
}
