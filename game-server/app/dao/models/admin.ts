import mongoose from 'mongoose'

// 管理员
const schema = new mongoose.Schema({
    account: {type: String, default: ''},
    password: {type: String, default: ''},
    permission: {type: Number, default: 0},
    nickname: {type: String, default: ''},
    createTime: {type: Number, default: 0}
})

// 管理员
export const adminModel = mongoose.model('admin', schema)
