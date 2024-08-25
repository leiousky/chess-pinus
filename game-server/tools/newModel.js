const {saveFile, upperCaseFirstLatter} = require("./common");
const path = require("path");
const process = require("process");

// https://mongoosejs.com/docs/typescript.html
function addModel(modelDir, tableName, comment){
    const iTable = `I${upperCaseFirstLatter(tableName)}`
    const modelText = `import {Schema, model} from 'mongoose'

// ${comment.trim()}
export interface ${iTable} {
}

// ${comment.trim()}
const schema = new Schema<${iTable}>({
    // TODO 添加字段
})

// ${comment.trim()}
const ${tableName}Model = model<${iTable}>('${tableName}', schema)

export class ${upperCaseFirstLatter(tableName)}Model {
}
`
    saveFile(modelDir, tableName + '.ts', modelText)
}

const appDir = path.join(path.dirname(__dirname), 'app')
const daoDir = path.join(appDir, 'dao', 'models')

if(process.argv.length !== 4) {
    console.error("使用 node newModel mongo表名(英文) 表名说明")
    process.exit(1)
}
const tableName = process.argv[2]
const tableComment = process.argv[3]
addModel(daoDir, tableName, tableComment)
