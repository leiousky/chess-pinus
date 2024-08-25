import {Application, cancelJob, scheduleJob} from 'pinus'
import {ArenaTask} from './task'
import {GlobalEnum} from '../../../constants/global'
import {arenaModel} from '../../../dao/models/arena'

// 定时器间隙
const ARENA_INTERVAL = 1000

// 管理竞技场
export class ArenaManger {

    // 竞技场定时器
    arenaScheduler: number
    // 所有场次
    allTasks: { [key: string]: ArenaTask }
    isChecking: boolean

    constructor() {
        this.isChecking = false
        this.allTasks = {}
    }

    // 所有服务启动后
    afterStartAll() {
        // 加载场次
        // this.createNewArenaIfNoExist()
        // 每1秒检查
        this.arenaScheduler = scheduleJob({
            start: Date.now() + ARENA_INTERVAL, period: ARENA_INTERVAL
        }, this.checkArenaTask.bind(this))
    }

    beforeShutdown() {
        cancelJob(this.arenaScheduler)
    }

    async checkArenaTask() {
        if (this.isChecking) {
            return
        }
        this.isChecking = true
        // 查找所有竞技场
        const arenaList = await arenaModel.find({isFinish: false})
        if (arenaList.length > 0) {
            for (let i = 0; i < arenaList.length; i++) {
                const model = arenaList[i]
                if (!this.allTasks[model.id]) {
                    // 新增的场次
                    this.allTasks[model.id] = new ArenaTask(model)
                }
            }
        }
        // 检查是否能开始
        const keys = Object.keys(this.allTasks)
        for (const k of keys) {
            const task = this.allTasks[k]
            if (task.isRunning() || task.isFinish()) {
                continue
            }
            if (task.isCanStart()) {
                // 开始安排桌子
                task.setRunning()
                await task.nextRound()
            } else {
                // // TODO 检查有没有过有效期
                // if (task.isExpired()) {
                //     task.setFinish()
                //     // TODO 要不要退报名费
                //     task.save()
                // }
                console.log('checking add robot')
                // 检查要不要加机器人
                await task.addRobot()
            }
        }
        this.isChecking = false
    }

    // TODO 玩家离线
    async playerOffline(uid: number) {
        await this.eachTask(async (task: ArenaTask) => {
            if (task.isPlayerJoin(uid)) {
                if (!task.isStart()) {
                    // 未开始，退出
                    task.playerExit(uid)
                } else {
                    console.error('arena started, can not exit')
                }
                return false
            }
            return true
        })
    }

    // 查找竞技场
    async eachTask(cb: (task: ArenaTask) => Promise<boolean>) {
        const keys = Object.keys(this.allTasks)
        for (const k of keys) {
            const isOk = await cb(this.allTasks[k])
            if (!isOk) {
                break
            }
        }
    }
}

export async function initArenaManager(app: Application) {
    const mgr = new ArenaManger()
    app.set(GlobalEnum.arenaManagerKey, mgr)
}
