import * as mongoose from 'mongoose'

// 记录自增id
const schema = new mongoose.Schema({
    // id 名
    name: {
        type: String,
        default: ''
    },
    // id
    idCounter: {
        type: Number,
        default: 0
    }
})

// 记录自增id
export const idCounterModel = mongoose.model('idCounter', schema)

// 使用方式
// const list = await idCounterModel.find()
// console.log(list)
// const newCounter = new idCounterModel({name: 'demo-counter', idCounter: 10})
// await newCounter.save()

// 新俱乐部 id
export async function newClubShortId() {
    const updater = {$inc: {idCounter: 1}}
    const record = await idCounterModel.findOneAndUpdate({
            name: 'club',
        },
        updater,
    )
    return record.idCounter
}

// 新 uid
export async function newUid() {
    const updater = {$inc: {idCounter: 1}}
    const record = await idCounterModel.findOneAndUpdate({
            name: 'uid',
        },
        updater,
    )
    return record.idCounter
}
