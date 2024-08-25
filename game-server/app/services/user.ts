import BaseService from './base'
import {IUserModel, userModel} from '../dao/models/user'
import services from './index'
import {pinus} from 'pinus'
import {GlobalEnum} from '../constants/global'
import {UserInfo} from '../types/connector/entry'
import {HydratedDocument} from 'mongoose'
import {IUserInfo} from '../types/interfaceApi'
import {UserStatus} from '../constants/game'
import {TUidAndFrontendId} from '../api/push'

// 加载配置
export default class UserService extends BaseService {
    constructor() {
        super()
    }

    // 获取 or 新建用户
    async getOrCreateUser(uid: number, account: string, password: string, spreaderId: string, userInfo: UserInfo) {
        const record: HydratedDocument<IUserModel> = await userModel.findOne({uid})
        if (!record) {
            // 新建
            let avatar = userInfo.avatar
            if (!avatar) {
                // 随机头像
                avatar = 'UserInfo/head_' + services.utils.getRandomNum(0, 15)
            }
            const startGold = pinus.app.get(GlobalEnum.publicParameterKey).startGold || 0
            const model = {
                uid,
                spreaderID: spreaderId,
                safePassword: password,
                gold: startGold,
                avatar,
                nickname: userInfo.nickname || account,
                createTime: new Date(),
                channelID: userInfo.chanelID || '',
                // 允许登录
                permission: 1,
            }
            const newRecord = new userModel(model)
            await newRecord.save()
            return newRecord
        }
        return record
    }

    buildGameRoomUserInfo(user: HydratedDocument<IUserModel>, chairId: number, userStatus: UserStatus) {
        const userInfo: IUserInfo = {
            avatar: user.avatar,
            diamond: user.diamond,
            gold: user.gold,
            nickname: user.nickname,
            robot: !!user.robot,
            spreadId: user.spreaderID,
            chairId: chairId || -1,
            frontendId: user.frontendId,
            uid: user.uid,
            userStatus: userStatus || UserStatus.none,
            takeChip: 0,
        }
        return userInfo
    }

    async getFrontIdByUidList(uidList: number[]) {
        const users = await userModel.find({uid: {$in: uidList}})
        const uidFrontList: TUidAndFrontendId = []
        for (const u of users) {
            uidFrontList.push({
                sid: u.frontendId,
                uid: u.uid.toString()
            })
        }
        return uidFrontList
    }
}
