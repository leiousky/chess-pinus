import errorCode from '../constants/errorCode'

// http 消息返回
export class BaseHttpRet {
    // 错误码
    code: number

    static error(code: number): string {
        return JSON.stringify({code})
    }

    static ok(msg: any) {
        return JSON.stringify({code: errorCode.ok, msg})
    }
}


// handler 消息返回
export class BaseHandlerResp {
    // 错误码
    code: number
    msg: any

    // 报错了
    static error(code: number) {
        return {code, msg: null}
    }

    // 返回成功
    static ok(msg?: any) {
        return {code: errorCode.ok, msg}
    }

    // // 响应成功
    // static success(msg: any): any {
    //     return {code: errorCode.ok, msg}
    // }
}
