// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {EmojiTypes, UserTypes} from 'action_types';

import type {CustomEmoji} from '../../types/emojis';
import type {GenericAction} from '../../types/actions';

function customEmoji(state: {[string]: CustomEmoji} = {}, action: GenericAction): {[string]: CustomEmoji} {
    switch (action.type) {
    case EmojiTypes.RECEIVED_CUSTOM_EMOJI: {
        const nextState = {...state};
        nextState[action.data.id] = action.data;
        return nextState;
    }
    case EmojiTypes.RECEIVED_CUSTOM_EMOJIS: {
        const nextState = {...state};
        for (const emoji of action.data) {
            nextState[emoji.id] = emoji;
        }
        return nextState;
    }
    case EmojiTypes.DELETED_CUSTOM_EMOJI: {
        const nextState = {...state};
        Reflect.deleteProperty(nextState, action.data.id);
        return nextState;
    }
    case EmojiTypes.CLEAR_CUSTOM_EMOJIS:
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function nonExistentEmoji(state = new Set(), action) {
    switch (action.type) {
    case EmojiTypes.CUSTOM_EMOJI_DOES_NOT_EXIST: {
        if (!state.has(action.data)) {
            const nextState = new Set(state);
            nextState.add(action.data);
            return nextState;
        }
        return state;
    }
    case EmojiTypes.RECEIVED_CUSTOM_EMOJI: {
        if (action.data && state.has(action.data.name)) {
            const nextState = new Set(state);
            nextState.delete(action.data.name);
            return nextState;
        }
        return state;
    }
    case EmojiTypes.RECEIVED_CUSTOM_EMOJIS: {
        const data = action.data || [];
        const nextState = new Set(state);

        let changed = false;
        for (const emoji of data) {
            if (emoji && nextState.has(emoji.name)) {
                nextState.delete(emoji.name);
                changed = true;
            }
        }
        return changed ? nextState : state;
    }
    case EmojiTypes.CLEAR_CUSTOM_EMOJIS:
    case UserTypes.LOGOUT_SUCCESS:
        return new Set();

    default:
        return state;
    }
}

export default combineReducers({

    // object where every key is the custom emoji id and has an object with the custom emoji details
    customEmoji,

    // set containing custom emoji names that do not exist
    nonExistentEmoji,

});
