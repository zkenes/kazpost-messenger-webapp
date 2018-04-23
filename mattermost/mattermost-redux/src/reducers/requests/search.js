// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {SearchTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from '../../types/actions';
import type {RequestStatusType} from '../../types/requests';

function searchPosts(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    if (action.type === SearchTypes.REMOVE_SEARCH_POSTS) {
        return initialRequestState();
    }

    return handleRequest(
        SearchTypes.SEARCH_POSTS_REQUEST,
        SearchTypes.SEARCH_POSTS_SUCCESS,
        SearchTypes.SEARCH_POSTS_FAILURE,
        state,
        action
    );
}

function flaggedPosts(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    if (action.type === SearchTypes.REMOVE_SEARCH_POSTS) {
        return initialRequestState();
    }

    return handleRequest(
        SearchTypes.SEARCH_FLAGGED_POSTS_REQUEST,
        SearchTypes.SEARCH_FLAGGED_POSTS_SUCCESS,
        SearchTypes.SEARCH_FLAGGED_POSTS_FAILURE,
        state,
        action
    );
}

function recentMentions(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    if (action.type === SearchTypes.REMOVE_SEARCH_POSTS) {
        return initialRequestState();
    }

    return handleRequest(
        SearchTypes.SEARCH_RECENT_MENTIONS_REQUEST,
        SearchTypes.SEARCH_RECENT_MENTIONS_SUCCESS,
        SearchTypes.SEARCH_RECENT_MENTIONS_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    flaggedPosts,
    recentMentions,
    searchPosts,
});
