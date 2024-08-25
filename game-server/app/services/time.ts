import BaseService from './base'
import {DateTime} from 'luxon'

export default class TimeService extends BaseService {
    constructor() {
        super()
    }

    // 牌局 id
    drawIdTime() {
        return DateTime.now().toFormat('yyyyLLddhhmmssSSS')
    }

    // 今日零点
    startOfDayBySeconds() {
        return DateTime.now().startOf('day').toSeconds()
    }

    // 从 js Date 还原
    fromDate(date: Date) {
        return DateTime.fromJSDate(date)
    }

    // 当前时间
    now() {
        return DateTime.now()
    }
}
