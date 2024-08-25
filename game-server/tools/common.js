const {writeFileSync, readFileSync} = require('fs')
const path = require('path')
const acorn = require("acorn");
const tsPlugin = require("acorn-typescript");

function parseSourceFile(tsPath) {
    const text = readFileSync(tsPath, 'utf8')
    // 注释
    const comments = []
    const node = acorn.Parser.extend(tsPlugin.default()).parse(text, {
        sourceType: 'module',
        ecmaVersion: 'latest',
        locations: true,
        onComment: comments,
    })
    return {node, comments, text}
}


function upperCaseFirstLatter(name) {
    return name[0].toUpperCase() + name.slice(1)
}

// 驼峰转下划线
function toUnderline(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

//下划线连接的变量转为驼峰变量
function toCamel(str) {
    return str.replace(/_(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

function saveFile(dirname, filename, text) {
    writeFileSync(path.join(dirname, filename), text, 'utf8')
}

module.exports = {
    parseSourceFile,
    toUnderline,
    upperCaseFirstLatter,
    toCamel,
    saveFile,
}
