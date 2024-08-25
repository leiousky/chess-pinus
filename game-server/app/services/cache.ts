import BaseService from './base'
import {pinus} from 'pinus'
import {GlobalEnum} from '../constants/global'
import Redis from 'ioredis'

export default class CacheService extends BaseService {
    constructor() {
        super()
    }

    async getStringKey(key: string): Promise<string> {
        const client = pinus.app.get(GlobalEnum.redisLocalKey) as Redis
        return client.get(key)
    }

    async setString(key: string, value: string, ttl?: number): Promise<void> {
        const client = pinus.app.get(GlobalEnum.redisLocalKey) as Redis
        await client.set(key, value)
        if (ttl) {
            await client.expire(key, ttl)
        }
    }

    async getJson(key: string): Promise<any> {
        const result = await this.getStringKey(key)
        if (result) {
            return JSON.parse(result)
        }
        return result
    }

    async setJson(key: string, value: string, ttl?: number): Promise<void> {
        await this.setString(key, JSON.stringify(value), ttl)
    }
}
