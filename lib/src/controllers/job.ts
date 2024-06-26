import { CronJobParams } from 'cron'
import { Decorator } from '@esliph/decorator'
import { Metadata, ClassConstructor } from '@esliph/metadata'
import { METADATA_KEY_JOB, METADATA_KEY_JOB_OPTIONS } from '../constants'

export type JobOptions = { name: string, executeInStart?: boolean } & Partial<CronJobParams>

export function Job(options: JobOptions) {
    function handle(constructor: any) {
        Metadata.Create.Class({ key: METADATA_KEY_JOB, value: true }, constructor)
        Metadata.Create.Class({ key: METADATA_KEY_JOB_OPTIONS, value: options }, constructor)
    }

    return Decorator.Create.Class(handle)
}

export function isJob(constructor: ClassConstructor) {
    return !!Metadata.Get.Class<boolean>(METADATA_KEY_JOB, constructor)
}