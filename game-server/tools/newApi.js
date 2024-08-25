const {parseSourceFile, saveFile, upperCaseFirstLatter} = require("./common")
const path = require("path");
const {readFileSync, existsSync, mkdirSync} = require("fs");
const process = require("process");

// 更新handler
function addApiToHandler(modName, apiName, apiComment) {
    const {node, text} = parseSourceFile(path.join(handlerDir, modName+'Handler.ts'))
    if (text.includes(`async ${apiName}(msg: I${upperCaseFirstLatter(apiName)}Req, session: FrontendSession)`)) {
        // 已经有了
        return
    }
    // 获取最后一个 method
    const lastMethod = {start: 0, end: 0}
    for (const bodyNode of node.body) {
        if (bodyNode.type === "ExportNamedDeclaration" && bodyNode.declaration.type === "ClassDeclaration"
            && bodyNode.declaration.id.name === "Handler") {
            // 检查最后一个 method 的位置
            for (const handlerBody of bodyNode.declaration.body.body) {
                if (handlerBody.type !== "MethodDefinition") {
                    continue
                }
                if (handlerBody.start > lastMethod.start && handlerBody.end > lastMethod.end) {
                    lastMethod.start = handlerBody.start
                    lastMethod.end = handlerBody.end
                }
            }
        }
    }
    // console.log("lastMethod", text.slice(lastMethod.start, lastMethod.end))
    const newApi = `
    /**
     * ${apiComment}
     * @param msg
     * @param session
     */
    async ${apiName}(msg: I${upperCaseFirstLatter(apiName)}Req, session: FrontendSession):Promise<I${upperCaseFirstLatter(apiName)}Resp> {
        // TODO do something
        return null
    }`
    const newHandler = text.slice(0, lastMethod.end) + "\n" + newApi + text.slice(lastMethod.end)
    saveFile(handlerDir, modName+"Handler.ts", newHandler)
}

// // 更新remoter
// function addApiToRemoter(actName, apiName, apiComment) {
//     const {node, text} = parseSourceFile(path.join(remoteDir, actName+'Remoter.ts'))
//     if (text.includes(`async ${apiName}(userId: number`)) {
//         // 已经有了
//         return
//     }
//     // 获取最后一个 method
//     const lastMethod = {start: 0, end: 0}
//     for (const bodyNode of node.body) {
//         if (bodyNode.type === "ExportNamedDeclaration" && bodyNode.declaration.type === "ClassDeclaration"
//             && bodyNode.declaration.id.name === `${upperCaseFirstLatter(actName)}Remoter`) {
//             // 检查最后一个 method 的位置
//             for (const handlerBody of bodyNode.declaration.body.body) {
//                 if (handlerBody.type !== "MethodDefinition") {
//                     continue
//                 }
//                 if (handlerBody.start > lastMethod.start && handlerBody.end > lastMethod.end) {
//                     lastMethod.start = handlerBody.start
//                     lastMethod.end = handlerBody.end
//                 }
//             }
//         }
//     }
//     // console.log("lastMethod", text.slice(lastMethod.start, lastMethod.end))
//     const newApi = `
//     // ${apiComment}
//     async ${apiName}(userId: number): Promise<${upperCaseFirstLatter(apiName)}Ret> {
//         const game: Game = bearcat.getBean("gameServer").getGame();
//         return ${upperCaseFirstLatter(apiName)}Ret.success()
//     }`
//     const newRemoter = text.slice(0, lastMethod.end) + "\n" + newApi + text.slice(lastMethod.end)
//     saveFile(remoteDir, actName+"Remoter.ts", newRemoter)
// }

// 更新 struct
function addApiRespToStruct(modName, apiName, apiComment){
    const text = readFileSync(path.join(typesDir, modName + ".ts")).toString("utf8")
    if (text.includes(`${upperCaseFirstLatter(apiName)}Resp`)) {
        // 有了
        return
    }
    // 往 struct 最后加
    const newRet = `

${addApiReqParameter(apiName)}

${addApiRespParameter(apiName)}

// ${apiComment}
export class ${upperCaseFirstLatter(apiName)}Resp extends BaseHandlerResp {
}`
    saveFile(typesDir, modName + ".ts", text + newRet)
}

// 添加请求参数
function addApiReqParameter(apiName){
    return `export interface I${upperCaseFirstLatter(apiName)}Req {
}`
}

// 添加响应参数
function addApiRespParameter(apiName){
    return `export interface I${upperCaseFirstLatter(apiName)}Resp {
    // 错误码
    code: number
    // 消息
    msg: any
}`
}

// 添加新接口
if(process.argv.length !== 6) {
    console.error("使用 node newApi server名 英文handler名 英文接口名 中文接口说明")
    process.exit(1)
}

// // server 名
// const serverName = 'connector'
// // 模块名
// const modName = "entry"
// // 接口名
// const apiName = "buildFire"
// // 接口说明
// const apiComment = "搭建篝火"

const serverName = process.argv[2]
const modName = process.argv[3]
const apiName = process.argv[4]
const apiComment = process.argv[5]

// const appDir = path.join(path.dirname(__dirname), "app")
const appDir = path.join(path.dirname(__dirname), 'app')

// struct 目录
const typesDir = path.join(appDir, "types", serverName)
// handler 目录
const handlerDir = path.join(appDir, "servers", serverName, "handler")
if (!existsSync(typesDir)) {
    // 不存在目录
    console.log('directory not exits', typesDir)
    process.exit(1)
}
if (!existsSync(handlerDir)) {
    // 不存在目录
    console.log('directory not exits', handlerDir)
    process.exit(1)
}

addApiToHandler(modName, apiName, apiComment)
addApiRespToStruct(modName, apiName, apiComment)
