import * as util from 'util'
import * as config from '../../config'
import * as mongoose from 'mongoose'
import {idCounterModel} from './models/idCounter'

const mongoConf = config.mongo
let mongoDbAddress: string
if (mongoConf.user && mongoConf.password) {
    mongoDbAddress = util.format('mongodb://%s:%s@%s:%s/%s', mongoConf.user, mongoConf.password, mongoConf.host, mongoConf.port, mongoConf.database)
} else {
    mongoDbAddress = util.format('mongodb://%s:%s/%s', mongoConf.host, mongoConf.port, mongoConf.database)
}

// 初始化自增 id
export async function initCounter() {
    const records = await idCounterModel.find()
    for (const counterInfo of config.idCounter) {
        const list = records.filter(value => {
            return value.name === counterInfo.name
        })
        if (list.length == 0) {
            // 新建
            const newCounter = new idCounterModel({name: counterInfo.name, idCounter: counterInfo.starter})
            await newCounter.save()
        }
    }
}


// 初始化
export async function initDb() {
    await mongoose.connect(mongoDbAddress)
}

export async function disconnectDb() {
    await mongoose.disconnect()
}
