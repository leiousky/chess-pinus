import * as mongoose from 'mongoose'

// 登录记录
const schema = new mongoose.Schema({
    uid: {type: String, default: ''},
    ip: {type: String, default: ''},
    createTime: {type: Number, default: 0}
})

// 登录记录
export const loginRecordModel = mongoose.model('loginRecord', schema)
