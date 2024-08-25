import {Schema, model} from 'mongoose'

export interface IAccountModel {
    account: string
    uid: number
    password: string
    phoneAccount: string
    areaCode: string
    wxAccount: string
    spreaderID: string
}

// 账号
const schema = new Schema<IAccountModel>({
    account: {type: String, default: ''},
    uid: {type: Number, default: 0},
    password: {type: String, default: ''},
    // 手机号
    phoneAccount: {type: String, default: ''},
    // 手机区号
    areaCode: {type: String, default: ''},
    wxAccount: {type: String, default: ''},
    spreaderID: {type: String, default: ''},
})
// 账号
export const accountModel = model<IAccountModel>('account', schema)
