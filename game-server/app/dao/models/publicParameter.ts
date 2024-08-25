import * as mongoose from 'mongoose'

export interface IPublicParameterModel {
    key: string
    value: string
    describe: string
    type: string
}

// 通用参数
const schema = new mongoose.Schema<IPublicParameterModel>({
    key: {type: String, default: ''},
    value: {type: String, default: ''},
    describe: {type: String, default: ''},
    type: {
        type: String,
        default: 'string',
    }
})

// 通用参数
export const publicParameterModel = mongoose.model<IPublicParameterModel>('publicParameter', schema)
