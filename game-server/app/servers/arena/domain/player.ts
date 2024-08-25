import {HydratedDocument, Types} from 'mongoose'
import {arenaPlayerModel, IArenaPlayerModel} from '../../../dao/models/arenaPlayer'

export async function newArenaPlayer(arenaId: Types.ObjectId, uid: number) {
    let record = await arenaPlayerModel.findOne({arenaId, uid})
    if (!record) {
        // 新建
        record = await arenaPlayerModel.create({arenaId, uid, topScore: 0})
    }
    return new ArenaPlayer(record)
}

// 玩家
export class ArenaPlayer {
    // arenaPlayer 表
    m: HydratedDocument<IArenaPlayerModel>

    constructor(doc: HydratedDocument<IArenaPlayerModel>) {
        this.m = doc
    }

    // 添加积分
    addScore(score: number) {
        this.m.topScore += score
    }

    score() {
        // 从最高分开始扣
        return 1000 + this.m.topScore
    }

    async save() {
        await this.m.save()
    }
}
