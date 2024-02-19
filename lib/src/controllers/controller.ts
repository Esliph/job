import { Injection } from '@esliph/injection'
import { ResultException } from '@esliph/common'
import { ClassConstructor, Metadata } from '@esliph/metadata'
import { ObserverEmitter } from '@esliph/observer'
import { JobOptions, isJob } from './job'
import { getMethodsInClassByMetadataKey } from '../util'
import { METADATA_KEY_CRON_OPTIONS, METADATA_KEY_JOB_OPTIONS } from '../constants'
import { CronOptions } from './cron'
import { JobModel } from '../entity/job'

export class JobController {
    private static jobs: JobModel[] = []
    private static emitter = new ObserverEmitter()

    getJobs() {
        return JobController.jobs as readonly JobModel[]
    }

    getJobByName(name: string) {
        return JobController.jobs.find(({ name: jobName }) => jobName == name) || null
    }

    static fabric({ jobs }: { jobs: ClassConstructor[] }) {
        const cronJobs = jobs.filter(job => {
            if (isJob(job)) { return true }
            throw new ResultException({ title: 'Job', message: `Class "${job.name}" must be decorated with @Job` })
        }).map(jobConstructor => {
            const { cronJobs, options } = JobController.getCronJobsByConstructor(jobConstructor)

            const jobs = cronJobs.map(methodCron => this.createCronJob(jobConstructor, methodCron, options)).filter(job => !!job)

            return jobs
        }).reduce((acc, value) => [...acc, ...value], []) as JobModel[]

        JobController.jobs = cronJobs
    }

    private static getCronJobsByConstructor(jobConstructor: ClassConstructor) {
        const jobOptions = Metadata.Get.Class<JobOptions>(METADATA_KEY_JOB_OPTIONS, jobConstructor)

        if (jobOptions.ignore) { return { cronJobs: [], options: { name: '' } } }

        const methodsCron = getMethodsInClassByMetadataKey<CronOptions>(jobConstructor, METADATA_KEY_CRON_OPTIONS)

        return { cronJobs: methodsCron, options: jobOptions }
    }

    private static createCronJob(jobConstructor: ClassConstructor, cronJob: { method: string; metadata: CronOptions }, options: JobOptions) {
        const cronOptions = { ...options, ...cronJob.metadata, name: `${options.name}.${cronJob.metadata.name}` }

        if (cronOptions.ignore) { return }

        const jobInstance = Injection.resolve(jobConstructor)

        const handler = async () => {
            try {
                JobController.emitter.emit('job/start', { ...cronOptions })

                await jobInstance[cronJob.method]()

                JobController.emitter.emit('job/end', { ...cronOptions })
            } catch (err: any) {
                JobController.emitter.emit('job/error', { ...cronOptions, error: err })
            }
        }

        const job = new JobModel({ ...cronOptions as any, name: cronOptions.name, cronTime: cronOptions.cronTime || '', onTick: handler, })

        return job
    }
}