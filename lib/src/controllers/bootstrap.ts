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

        const methodsCron = getMethodsInClassByMetadataKey<CronOptions>(jobConstructor, METADATA_KEY_CRON_OPTIONS)

        methodsCron.map(methodCron => {
            const options = { ...jobOptions, ...methodCron.metadata, name: `${jobOptions.name}.${methodCron.metadata.name}` }

            const jobInstance = Injection.resolve(jobConstructor)

            const job = new CronJob(
                options.cronTime || '',
                async () => {
                    try {
                        emitter.emit('job/start', { ...options })

                        await jobInstance[methodCron.method]()

                        emitter.emit('job/end', { ...options })
                    } catch (err: any) {
                        emitter.emit('job/error', { ...options, error: err })
                    }
                },
                null,
                !!options.start,
                options.timeZone
            )

            if (options.alreadyStart) {
                job.fireOnTick()
            }

            if (!options.start) {
                job.start()
            }
        })
    })
}
