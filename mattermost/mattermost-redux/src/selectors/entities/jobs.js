// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

export function getAllJobs(state) {
    return state.entities.jobs.jobs;
}

export function getJobsByType(state) {
    return state.entities.jobs.jobsByTypeList;
}

export function makeGetJobsByType(type) {
    return createSelector(
        getJobsByType,
        (jobsByType) => {
            return Object.values(jobsByType[type] || []);
        }
    );
}
