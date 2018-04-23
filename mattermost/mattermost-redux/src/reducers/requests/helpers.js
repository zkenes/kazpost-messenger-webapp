// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

import {RequestStatus} from 'constants';

import type {GenericAction} from '../../types/actions';
import type {RequestStatusType} from '../../types/requests';

export function initialRequestState(): RequestStatusType {
    return {
        status: RequestStatus.NOT_STARTED,
        error: null,
    };
}

export function handleRequest(
    REQUEST: string,
    SUCCESS: string,
    FAILURE: string,
    state: RequestStatusType,
    action: GenericAction
): RequestStatusType {
    switch (action.type) {
    case REQUEST:
        return {
            ...state,
            status: RequestStatus.STARTED,
        };
    case SUCCESS:
        return {
            ...state,
            status: RequestStatus.SUCCESS,
            error: null,
        };
    case FAILURE: {
        let error = action.error;
        if (error instanceof Error) {
            error = error.hasOwnProperty('intl') ? JSON.parse(JSON.stringify(error)) : error.toString();
        }

        return {
            ...state,
            status: RequestStatus.FAILURE,
            error,
        };
    }
    default:
        return state;
    }
}
