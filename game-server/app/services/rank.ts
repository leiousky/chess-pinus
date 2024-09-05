import BaseService from './base'
import {pinus} from 'pinus'
import {GlobalEnum} from '../constants/global'
import Redis from 'ioredis'

export default class RankService extends BaseService {
    constructor() {
        super()
    }

    // 添加到本服榜
    async addLocalRank(rankName: string, score: number, member: string) {
        const client = pinus.app.get(GlobalEnum.redisLocalKey) as Redis
        // 2099 年的秒数：4070880000
        const scoreString = score.toString() + '.' + (4070880000 - Date.now()).toString()
        await client.zadd(rankName, scoreString, member)
    }

    async getRankWithRang(rankName: string, start: number, stop: number, withScore: boolean) {
        const client = pinus.app.get(GlobalEnum.redisLocalKey) as Redis
        if (withScore) {
            return await client.zrevrange(rankName, start, stop, 'WITHSCORES')
        } else {
            return await client.zrevrange(rankName, start, stop)
        }
    }
}
