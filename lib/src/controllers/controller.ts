import { ClassConstructor, Metadata } from '@esliph/metadata'
import { ObserverEmitter } from '@esliph/observer'
import { JobOptions, isJob } from './job'
import { getMethodsInClassByMetadataKey } from '../util'
import { METADATA_KEY_CRON_OPTIONS, METADATA_KEY_JOB_OPTIONS } from '../constants'
import { CronOptions } from './cron'
import { JobModel } from '../entity/job'

export class JobProvider {
    private jobs: JobModel[] = []
    private emitter = new ObserverEmitter()

    fabric({ jobs = [] }: { jobs: ClassConstructor[] }) {
        for (let i = 0; i < jobs.length; i++)
            if (!isJob(jobs[i])) throw `Class "${jobs[i].name}" must be decorated with @Job`

        const cronJobs = jobs.map(jobConstructor => {
            const { cronJobs, options } = this.getCronJobsByConstructor(jobConstructor)

            const jobs = cronJobs.map(methodCron => this.createCronJob(jobConstructor, methodCron, options)).filter(job => !!job)

            return jobs
        }).reduce((acc, value) => [...acc, ...value], []) as JobModel[]

        this.jobs = cronJobs
    }

    private getCronJobsByConstructor(jobConstructor: ClassConstructor) {
        return {
            cronJobs: getMethodsInClassByMetadataKey<CronOptions>(jobConstructor, METADATA_KEY_CRON_OPTIONS),
            options: Metadata.Get.Class<JobOptions>(METADATA_KEY_JOB_OPTIONS, jobConstructor),
        }
    }

    private createCronJob(jobConstructor: ClassConstructor, cronJob: { method: string; metadata: CronOptions }, options: JobOptions) {
        const cronOptions = { ...options, ...cronJob.metadata, name: `${options.name}.${cronJob.metadata.name}` }

        const jobInstance = new jobConstructor()

        const handler = async () => {
            try {
                this.emitter.emit('job/start', { ...cronOptions })

                await jobInstance[cronJob.method]()

                this.emitter.emit('job/success', { ...cronOptions })
            } catch (err: any) {
                this.emitter.emit('job/error', { ...cronOptions, error: err })
            }

            this.emitter.emit('job/end', { ...cronOptions })
        }

        const job = new JobModel({ ...cronOptions as any, name: cronOptions.name, cronTime: cronOptions.cronTime || '', onTick: handler, })

        return job
    }

    getJobs() {
        return this.jobs as readonly JobModel[]
    }

    getJobByName(name: string) {
        return this.jobs.find(({ name: jobName }) => jobName == name) || null
    }
}