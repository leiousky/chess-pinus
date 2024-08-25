import {HydratedDocument, Types} from 'mongoose'
import {arenaTableModel, IArenaTableModel} from '../../../dao/models/arenaTable'

export class ArenaTable {
    // arenaTable 表
    m: HydratedDocument<IArenaTableModel>

    constructor(doc: HydratedDocument<IArenaTableModel>) {
        this.m = doc
    }

    setRoomId(roomId: number) {
        this.m.roomId = roomId
    }

    setPlayers(players: number[]) {
        this.m.players = players
    }

    setGameRule(gameRule) {
        this.m.gameRule = gameRule
    }

    // 第几小局完成
    addRoomRound() {
        this.m.roomRound++
    }

    isFinish() {
        return this.m.roomRound === this.m.gameRule.maxDrawCount
    }

    getArenaRound() {
        return this.m.arenaRound
    }

    async save() {
        await this.m.save()
    }
}

// // 竞技场小局
// class ArenaRound {
//     // arenaRound 表
//     m = null
//
//     constructor(doc) {
//         this.m = doc
//     }
// }

// // 新一局
// function newArenaRound(players, arenaId, round) {
//     dao.findOneData('arenaRoundModel', {arenaId, currentRound: round}, function (err, result) {
//         if (!!err) {
//             console.info('============== get arenaRound err', err);
//             return null
//         } else {
//             if (result) {
//                 // 存在
//                 return new ArenaRound(result)
//             } else {
//                 // 新建
//                 const newArenaRound = {
//                     arenaId,
//                     // TODO 房间号
//                     roomNo: 0,
//                     currentRound: round,
//                     players: [],
//                 }
//                 dao.createData('arenaRoundModel', newArenaRound, function (err, result) {
//                     if (!!err) {
//                         console.info('========= add arenaRoundModel error', err);
//                         return null
//                     } else {
//                         return new ArenaRound(result)
//                     }
//                 })
//             }
//         }
//     })
// }

export async function newArenaTable(arenaId: Types.ObjectId, tableId: number, arenaRound: number) {
    let record = await arenaTableModel.findOne({arenaId, tableId})
    if (!record) {
        const m: IArenaTableModel = {
            arenaId,
            arenaRound,
            gameRule: {maxDrawCount: 0},
            players: [],
            roomId: 0,
            roomRound: 0,
            tableId,

        }
        record = await arenaTableModel.create(m)
    }
    return new ArenaTable(record)
}
