// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

export const PostTypes = {
    CHANNEL_DELETED: 'system_channel_deleted',
    DISPLAYNAME_CHANGE: 'system_displayname_change',
    CONVERT_CHANNEL: 'system_convert_channel',
    EPHEMERAL: 'system_ephemeral',
    EPHEMERAL_ADD_TO_CHANNEL: 'system_ephemeral_add_to_channel',
    HEADER_CHANGE: 'system_header_change',
    PURPOSE_CHANGE: 'system_purpose_change',

    JOIN_LEAVE: 'system_join_leave',
    JOIN_CHANNEL: 'system_join_channel',
    LEAVE_CHANNEL: 'system_leave_channel',
    ADD_REMOVE: 'system_add_remove',
    ADD_TO_CHANNEL: 'system_add_to_channel',
    REMOVE_FROM_CHANNEL: 'system_remove_from_channel',

    JOIN_TEAM: 'system_join_team',
    LEAVE_TEAM: 'system_leave_team',
    ADD_TO_TEAM: 'system_add_to_team',
    REMOVE_FROM_TEAM: 'system_remove_from_team',
};

export default {
    POST_CHUNK_SIZE: 60,
    POST_DELETED: 'DELETED',
    SYSTEM_MESSAGE_PREFIX: 'system_',
    SYSTEM_AUTO_RESPONDER: 'system_auto_responder',
    POST_TYPES: PostTypes,
    MESSAGE_TYPES: {
        POST: 'post',
        COMMENT: 'comment',
    },
    MAX_PREV_MSGS: 100,
    POST_COLLAPSE_TIMEOUT: 1000 * 60 * 5, // five minutes
    IGNORE_POST_TYPES: [
        PostTypes.ADD_REMOVE,
        PostTypes.ADD_TO_CHANNEL,
        PostTypes.CHANNEL_DELETED,
        PostTypes.JOIN_LEAVE,
        PostTypes.JOIN_CHANNEL,
        PostTypes.LEAVE_CHANNEL,
        PostTypes.REMOVE_FROM_CHANNEL,
        PostTypes.JOIN_TEAM,
        PostTypes.LEAVE_TEAM,
        PostTypes.ADD_TO_TEAM,
        PostTypes.REMOVE_FROM_TEAM,
    ],
};
