import {HydratedDocument, Types} from 'mongoose'
import {ClubRequestModel, IClubRequest} from '../models/clubRequest'
import {UserModel} from '../models/user'
import {IClubRequestInfo} from "../../types/hall/club";

export class ClubRequest {
    m: HydratedDocument<IClubRequest>

    constructor(doc: HydratedDocument<IClubRequest>) {
        this.m = doc
    }

    async save() {
        await this.m.save()
    }

    async remove() {
        await this.m.deleteOne()
    }

    refuse() {
        this.m.isAgree = false
    }

    async toClient(): Promise<IClubRequestInfo> {
        const user = await UserModel.getUserById(this.m.playerId)
        return {
            playerUid: this.m.playerUid,
            // 申请时间
            createAt: this.m.createAt,
            // 是否同意申请
            isAgree: this.m.isAgree,
            nickname: user && user.nickname || '',
            // 申请 id
            requestId: this.m.id
        }
    }

    static async clubRequestFromRaw(clubShortId: number, playerUid: number, playerId: Types.ObjectId) {
        const m: IClubRequest = {
            clubShortId,
            createAt: new Date(),
            isAgree: false,
            playerId,
            playerUid,
        }
        const record = await ClubRequestModel.newRequestModel(m)
        return new ClubRequest(record)
    }

    static async clubRequestList(clubShortId: number) {
        // 获取申请列表
        const records = await ClubRequestModel.findRequestByClubShortId(clubShortId)
        const list: ClubRequest[] = []
        for (const r of records) {
            list.push(new ClubRequest(r))
        }
        return list
    }

    static async getRequestById(requestId: string) {
        const record = await ClubRequestModel.getRequestById(requestId)
        if (record) {
            return new ClubRequest(record)
        }
        return null
    }
}
