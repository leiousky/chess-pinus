import {Schema, model} from 'mongoose'

// 俱乐部配置
export interface IClubConfig {
    // 局数选项
    drawCountOpts: number[]
    // 人数选项
    playerCountOpts: number[]
    // 创建战队需要的钻石
    roomDiamond: number
}

// 俱乐部配置
const schema = new Schema<IClubConfig>({
    drawCountOpts: {
        type: [Number],
        default: []
    },
    playerCountOpts: {
        type: [Number],
        default: [],
    },
    roomDiamond: {
        type: Number,
        default: 0,
    }
})

// 俱乐部配置
const clubConfigModel = model<IClubConfig>('clubConfig', schema)

export class ClubConfigModel {
    // 获取俱乐部配置
    static async getClubConfig(): Promise<IClubConfig> {
        const record = await clubConfigModel.findOne({})
        if (!record) {
            // 默认
            return {drawCountOpts: [2, 4, 6, 8], playerCountOpts: [2, 3, 6, 9], roomDiamond: 0}
        }
        return {
            drawCountOpts: record.playerCountOpts,
            playerCountOpts: record.playerCountOpts,
            roomDiamond: record.roomDiamond
        }
    }
}
