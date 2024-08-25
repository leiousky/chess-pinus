import {HydratedDocument} from 'mongoose'
import BaseService from './base'
import {randomBytes} from 'crypto'

export default class UtilsService extends BaseService {
    constructor() {
        super()
    }

    // 随机[min, max]
    getRandomNum(min: number, max: number): number {
        const range = max - min
        const rand = Math.random()
        return (min + Math.round(range * rand))
    }

    getUniqueIndex() {
        const date = new Date()
        return '' + date.getFullYear() + date.getMonth() + date.getDay() + date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds() + this.getRandomNum(1000, 9999)
    }

    // mongo list 转为 map, pk为 key
    modelArrayToMap(models: HydratedDocument<any>, pk: string) {
        const map = {}
        if (!models || models.length == 0) {
            return map
        }
        for (const m of models) {
            {
                if (m[pk]) {
                    map[pk] = m
                }
            }
        }
        return map
    }

    keepNumberPoint(num: number, maxDecimalLength: number) {
        let base = 1
        for (let i = 0; i < maxDecimalLength; ++i) {
            base *= 10
        }
        return Math.floor(num * base) / base
    }

    // 生成随机字符
    randomStr(len: number, replaceO0?: boolean) {
        // 生成 len 位字符,  randomBytes 生成的字节数，1个字节8位，则最后转化成16进制（4位）时，为2个字符,所以要除以2
        const s = randomBytes(len / 2).toString('hex')
        if (replaceO0) {
            // 0变为1， o、O换成A
            return s.replace(/oO/g, 'A').replace(/0/g, '1')
        }
        return s
    }

    deepClone(source: any): any {
        if (null == source) {
            return source
        }
        let newObject: any
        let bArray: boolean
        if (Array.isArray(source)) {
            newObject = []
            bArray = true
        } else {
            newObject = {}
            bArray = false
        }
        for (let _i = 0, _a = Object.keys(source); _i < _a.length; _i++) {
            const key = _a[_i]
            if (null == source[key]) {
                if (bArray) {
                    newObject.push(null)
                } else {
                    newObject[key] = null
                }
            } else {
                const sub = (this.isObject(source[key])) ? this.deepClone(source[key]) : source[key]
                if (bArray) {
                    newObject.push(sub)
                } else {
                    newObject[key] = sub
                }
            }
        }
        return newObject
    }

    isObject(value: any) {
        return value !== null && typeof value === 'object'
    }

    // 获得从m中取n的所有组合
    getCombinationFlagArrs(m: number, n: number) {
        if (!n || n < 1 || m < n) {
            return []
        }
        if (m === n) {
            return [[1, 1]]
        }
        const resultArrs: number[][] = []
        const flagArr: number[] = []
        let isEnd = false
        let i: number, j: number, leftCnt: number
        for (i = 0; i < m; i++) {
            flagArr[i] = i < n ? 1 : 0
        }

        resultArrs.push(flagArr.concat())

        while (!isEnd) {
            leftCnt = 0
            for (i = 0; i < m - 1; i++) {
                if (flagArr[i] === 1 && flagArr[i + 1] === 0) {
                    for (j = 0; j < i; j++) {
                        flagArr[j] = j < leftCnt ? 1 : 0
                    }
                    flagArr[i] = 0
                    flagArr[i + 1] = 1
                    const aTmp = flagArr.concat()
                    resultArrs.push(aTmp)
                    if (aTmp.slice(-n).join('').indexOf('0') === -1) {
                        isEnd = true
                    }
                    break
                }
                flagArr[i] === 1 && leftCnt++
            }
        }
        return resultArrs
    }

    shuffleArray<T>(list: T[]) {
        for (let i = 1; i < list.length; i++) {
            const random = Math.floor(Math.random() * (i + 1));
            [list[i], list[random]] = [list[random], list[i]]
        }
        return list
    }
}
