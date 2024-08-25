import {HydratedDocument, Types} from 'mongoose'
import {ClubModel, IClub} from '../models/club'
import {newClubShortId} from '../models/idCounter'

export class Club {
    m: HydratedDocument<IClub>

    constructor(doc: HydratedDocument<IClub>) {
        this.m = doc
    }

    async remove() {
        await this.m.deleteOne()
    }

    rename(newName: string) {
        this.m.name = newName
    }

    async save() {
        await this.m.save()
    }

    // 追加黑名单
    addToBlockList(uid: number) {
        if (this.m.blockList.indexOf(uid) == -1) {
            this.m.blockList.push(uid)
        }
    }

    // 删除黑名单
    removeFromBlockList(uid: number) {
        const index = this.m.blockList.indexOf(uid)
        if (index !== -1) {
            return
        }
        this.m.blockList.splice(index, 1)
    }

    // 新建俱乐部
    static async clubFromRaw(name: string, creatorId: Types.ObjectId, creatorUid: number) {
        const clubShortId = await newClubShortId()
        const m: IClub = {
            name,
            creatorUid,
            creatorId,
            createAt: new Date(),
            clubShortId,
            blockList: [],
        }
        const doc = await ClubModel.newClubModel(m)
        return new Club(doc)
    }

    static async getClubByIdList(clubIdList: Types.ObjectId[]) {
        const records = await ClubModel.getClubByIdList(clubIdList)
        const clubs: { [key: string]: Club } = {}
        for (const r of records) {
            clubs[r.id] = new Club(r)
        }
        return clubs
    }

    static async getClubById(id: Types.ObjectId): Promise<Club> {
        const record = await ClubModel.getClubById(id)
        if (!record) {
            return null
        }
        return new Club(record)
    }

    static async getClubByShortId(clubShortId: number): Promise<Club> {
        const record = await ClubModel.getClubByShortId(clubShortId)
        if (!record) {
            return null
        }
        return new Club(record)
    }
}
