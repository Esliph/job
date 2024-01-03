import { CronJob } from 'cron'
import { Injection } from '@esliph/injection'
import { ResultException } from '@esliph/common'
import { ClassConstructor, Metadata } from '@esliph/metadata'
import { ObserverEmitter } from '@esliph/observer'
import { JobOptions, isJob } from './job'
import { getMethodsInClassByMetadataKey } from '../util'
import { METADATA_KEY_CRON_OPTIONS, METADATA_KEY_JOB_OPTIONS } from '../constants'
import { CronOptions, } from './cron'

export function Bootstrap(Jobs: ClassConstructor[]) {
    const emitter = new ObserverEmitter()

    Jobs.map(jobConstructor => {
        if (!isJob(jobConstructor)) {
            throw new ResultException({ title: 'Job', message: `Class "${jobConstructor.name}" must be decorated with @Job` })
        }

        const jobOptions = Metadata.Get.Class<JobOptions>(METADATA_KEY_JOB_OPTIONS, jobConstructor)

        if (jobOptions.ignore) { return }

        const methodsCron = getMethodsInClassByMetadataKey<CronOptions>(jobConstructor, METADATA_KEY_CRON_OPTIONS)

        methodsCron.map(methodCron => {
            const cronOptions = { ...jobOptions, ...methodCron.metadata, name: `${jobOptions.name}.${methodCron.metadata.name}` }

            if (cronOptions.ignore) { return }

            const jobInstance = Injection.resolve(jobConstructor)

            const job = new CronJob(
                cronOptions.cronTime || '',
                async () => {
                    try {
                        emitter.emit('job/start', { ...cronOptions })

                        await jobInstance[methodCron.method]()

                        emitter.emit('job/end', { ...cronOptions })
                    } catch (err: any) {
                        emitter.emit('job/error', { ...cronOptions, error: err })
                    }
                },
                null,
                !!cronOptions.start,
                cronOptions.timeZone
            )

            if (cronOptions.alreadyStart) {
                job.fireOnTick()
            }

            if (!cronOptions.start) {
                job.start()
            }
        })
    })
}
