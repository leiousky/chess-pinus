import services from '../../../services'

// 启动
export async function afterStartup() {
    await services.parameter.afterAppStartup()
}
