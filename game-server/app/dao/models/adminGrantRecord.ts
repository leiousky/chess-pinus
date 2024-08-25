import * as mongoose from "mongoose";

// 赠送记录
const schema = new mongoose.Schema({
    uid: {type: String, default: ""},
    nickname: {type: String, default: ""},
    gainUid: {type: String, default: ""},
    type: {type: String, default: ""},
    count: {type: String, default: ""},
    createTime: {type: Number, default: 0}
});

// 赠送记录
export const adminGrantRecordModel = mongoose.model('adminGrantRecord', schema)
