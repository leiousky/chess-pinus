import {Application} from 'pinus'
import {ArenaManger} from '../domain/manager'
import {GlobalEnum} from '../../../constants/global'

export default function (app: Application) {
    return new ArenaRemoter(app)
}

export class ArenaRemoter {
    constructor(private app: Application) {

    }

    get arenaManager(): ArenaManger {
        return this.app.get(GlobalEnum.arenaManagerKey)
    }

    // 玩家离线
    async playerOffline(uid: number) {
        console.log('=============== player', uid, 'offline')
        await this.arenaManager.playerOffline(uid)
    }

    // 小局结束
    async roundOver(data: { arenaId: string, roomId: string, data: any }) {
        console.log('============= roundOver', data.arenaId, data.roomId)
        const arenaId = data.arenaId
        const roomId = data.roomId
        // 小局分数
        const roundResult = data.data
        await this.arenaManager.eachTask(async (task) => {
            if (task.m.id === arenaId) {
                // 找到
                console.log('find arena')
                await task.addRoomRound(Number(roomId))
                task.updatePlayerScore(roundResult)
                // 下一局
                if (await task.isAllTableFinish()) {
                    console.log('next round')
                    await task.nextRound()
                }
                // TODO save
                // task.saveTable(roomId)
                return false
            }
        })
    }
}
