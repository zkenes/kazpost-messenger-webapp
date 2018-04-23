// @flow

export type JobType = 'data_retention' | 'elasticsearch_post_indexing' | 'ldap_sync' | 'message_export';
export type JobStatus = 'pending' | 'in_progress' | 'success' | 'error' | 'cancel_requested' | 'canceled';

export type Job = {
    id: string,
    type: JobType,
    priority: number,
    create_at: number,
    start_at: number,
    last_activity_at: number,
    status: JobStatus,
    progress: number,
    data: Object
}

export type JobsState = {
    jobs: {[string]: Job},
    jobsByTypeList: {[JobType]: Array<Job>}
};
