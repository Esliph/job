import { CronJob, CronJobParams } from 'cron'

export type JobModelParams = CronJobParams & { name: string, alreadyStart?: boolean }

export class JobModel extends CronJob {
    name = ''
    alreadyStart = false
    private handler: () => Promise<any | void> = null as any

    constructor({ cronTime, name, onTick, alreadyStart, context, onComplete, runOnInit, start, timeZone, unrefTimeout, utcOffset }: JobModelParams) {
        super(cronTime, async () => await this.execute(), onComplete, start, timeZone as any, context, runOnInit, utcOffset, unrefTimeout)

        this.name = name
        this.handler = onTick as any

        if (alreadyStart) {
            this.execute()
        }
    }

    async execute() {
        const result = await this.handler()

        return result
    }

    getLastExecution() {
        return this.lastExecution
    }

    getNextExecution() {
        return this.nextDate().toJSDate()
    }
}