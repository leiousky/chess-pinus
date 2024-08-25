const cpy = require('cpy')
// 复制配置文件到打包好的目录中
cpy(['./config/*'], './dist/config/').then(() => {
    console.log('build. config files copied')
})
// pm2 配置
cpy(['./*.config.js'], './dist/').then(() => {
    console.log('build. pm2 config files copied')
})

// package.json 配置
cpy(['./package.json'], './dist/').then(() => {
    console.log('build. package.json files copied')
})

// http 配置
cpy(['./app/public/*'], './dist/app/public/').then(() => {
    console.log('build. package.json files copied')
})
