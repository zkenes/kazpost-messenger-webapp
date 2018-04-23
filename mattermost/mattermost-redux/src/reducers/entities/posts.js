// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {PostTypes, SearchTypes, UserTypes} from 'action_types';
import {Posts} from 'constants';
import {comparePosts} from 'utils/post_utils';

function handleReceivedPost(posts = {}, postsInChannel = {}, postsInThread = {}, action) {
    const post = action.data;
    const channelId = post.channel_id;

    const nextPosts = {
        ...posts,
        [post.id]: post,
    };

    let nextPostsInChannel = postsInChannel;

    // Only change postsInChannel if the order of the posts needs to change
    if (!postsInChannel[channelId] || !postsInChannel[channelId].includes(post.id)) {
        // If we don't already have the post, assume it's the most recent one
        const postsForChannel = postsInChannel[channelId] || [];

        nextPostsInChannel = {...postsInChannel};
        nextPostsInChannel[channelId] = [
            post.id,
            ...postsForChannel,
        ];
    }

    let nextPostsInThread = postsInThread;
    if (post.root_id && (!postsInThread[post.root_id] || !postsInThread[post.root_id].includes(post.id))) {
        const postsForThread = postsInThread[post.root_id] || [];

        nextPostsInThread = {...postsInThread};
        nextPostsInThread[post.root_id] = [
            post.id,
            ...postsForThread,
        ];
    }

    return {posts: nextPosts, postsInChannel: nextPostsInChannel, postsInThread: nextPostsInThread};
}

function handleRemovePendingPost(posts = {}, postsInChannel = {}, postsInThread = {}, action) {
    const pendingPostId = action.data.id;
    const channelId = action.data.channel_id;
    const pendingPost = posts[pendingPostId];

    const nextPosts = {
        ...posts,
    };

    Reflect.deleteProperty(nextPosts, pendingPostId);

    let nextPostsInChannel = postsInChannel;

    // Only change postsInChannel if the order of the posts needs to change
    if (!postsInChannel[channelId] || postsInChannel[channelId].includes(pendingPostId)) {
        // If we don't already have the post, assume it's the most recent one
        const postsForChannel = postsInChannel[channelId] || [];

        nextPostsInChannel = {...postsInChannel};
        nextPostsInChannel[channelId] = postsForChannel.filter((postId) => postId !== pendingPostId);
    }

    let nextPostsInThread = postsInThread;
    if (pendingPost.root_id && (!postsInThread[pendingPost.root_id] || postsInThread[pendingPost.root_id].includes(pendingPostId))) {
        const postsForThread = postsInThread[pendingPost.root_id] || [];

        nextPostsInThread = {...postsInThread};
        nextPostsInThread[pendingPost.root_id] = postsForThread.filter((postId) => postId !== pendingPostId);
    }

    return {posts: nextPosts, postsInChannel: nextPostsInChannel, postsInThread: nextPostsInThread};
}

function handleReceivedPosts(posts = {}, postsInChannel = {}, postsInThread = {}, action) {
    const newPosts = action.data.posts;
    const channelId = action.channelId;
    const skipAddToChannel = action.skipAddToChannel;

    // Change the state only if we have new posts,
    // otherwise there's no need to create a new object for the same state.
    if (!Object.keys(newPosts).length) {
        return {posts, postsInChannel, postsInThread};
    }

    const nextPosts = {...posts};
    const nextPostsInChannel = {...postsInChannel};
    const nextPostsInThread = {...postsInThread};
    const postsForChannel = postsInChannel[channelId] ? [...postsInChannel[channelId]] : [];

    for (const newPost of Object.values(newPosts)) {
        if (newPost.delete_at > 0) {
            // Mark the post as deleted if we have it
            if (nextPosts[newPost.id]) {
                nextPosts[newPost.id] = {
                    ...newPost,
                    state: Posts.POST_DELETED,
                    file_ids: [],
                    has_reactions: false,
                };
            } else {
                continue;
            }
        }

        // Only change the stored post if it's changed since we last received it
        if (!nextPosts[newPost.id] || nextPosts[newPost.id].update_at < newPost.update_at) {
            nextPosts[newPost.id] = newPost;
        }

        if (!skipAddToChannel && !postsForChannel.includes(newPost.id)) {
            // Just add the post id to the end of the order and we'll sort it out later
            postsForChannel.push(newPost.id);
        }

        // Remove any temporary posts
        if (nextPosts[newPost.pending_post_id]) {
            Reflect.deleteProperty(nextPosts, newPost.pending_post_id);

            const index = postsForChannel.indexOf(newPost.pending_post_id);
            if (index !== -1) {
                postsForChannel.splice(index, 1);
            }
        }

        if (!newPost.root_id) {
            continue;
        }

        const postsForThread = nextPostsInThread[newPost.root_id] ? [...nextPostsInThread[newPost.root_id]] : [];
        if (!postsForThread.includes(newPost.id)) {
            postsForThread.push(newPost.id);
        }

        const index = postsForThread.indexOf(newPost.pending_post_id);
        if (index !== -1) {
            postsForThread.splice(index, 1);
        }

        nextPostsInThread[newPost.root_id] = postsForThread;
    }

    // Sort to ensure that the most recent posts are first, with pending
    // and failed posts first
    postsForChannel.sort((a, b) => {
        return comparePosts(nextPosts[a], nextPosts[b]);
    });

    nextPostsInChannel[channelId] = postsForChannel;

    return {posts: nextPosts, postsInChannel: nextPostsInChannel, postsInThread: nextPostsInThread};
}

function handlePendingPosts(pendingPostIds = [], action) {
    switch (action.type) {
    case PostTypes.RECEIVED_NEW_POST: {
        const post = action.data;
        const nextPendingPostIds = [...pendingPostIds];
        if (post.pending_post_id && !nextPendingPostIds.includes(post.pending_post_id)) {
            nextPendingPostIds.push(post.pending_post_id);
        }
        return nextPendingPostIds;
    }
    case PostTypes.REMOVE_PENDING_POST: {
        const pendingPostId = action.data.id;
        const nextPendingPostIds = pendingPostIds.filter((postId) => postId !== pendingPostId);
        return nextPendingPostIds;
    }
    case PostTypes.RECEIVED_POSTS: {
        const newPosts = action.data.posts;
        const nextPendingPostIds = [...pendingPostIds];

        if (!Object.keys(newPosts).length) {
            return pendingPostIds;
        }

        for (const newPost of Object.values(newPosts)) {
            const index = nextPendingPostIds.indexOf(newPost.pending_post_id);
            if (index !== -1) {
                nextPendingPostIds.splice(index, 1);
            }
        }

        return nextPendingPostIds;
    }
    default:
        return pendingPostIds;
    }
}

function handlePostsFromSearch(posts = {}, postsInChannel = {}, postsInThread = {}, action) {
    const newPosts = action.data.posts;
    let info = {posts, postsInChannel, postsInThread};
    const postsForChannel = new Map();

    const postIds = Object.keys(newPosts);
    for (const id of postIds) {
        const nextPost = newPosts[id];
        const channelId = nextPost.channel_id;
        if (postsForChannel.has(channelId)) {
            postsForChannel.get(channelId)[id] = nextPost;
        } else {
            postsForChannel.set(channelId, {[id]: nextPost});
        }
    }

    postsForChannel.forEach((postList, channelId) => {
        info = handleReceivedPosts(info.posts, postsInChannel, postsInThread, {channelId, data: {posts: postList}});
    });

    return info;
}

function handlePostDeleted(posts = {}, postsInChannel = {}, postsInThread = {}, action) {
    const post = action.data;
    const channelId = post.channel_id;

    let nextPosts = posts;
    let nextPostsForChannel = postsInChannel;
    let nextPostsForThread = postsInThread;

    // We only need to do something if already have the post
    if (posts[post.id]) {
        nextPosts = {...posts};
        nextPostsForChannel = {...postsInChannel};

        // Mark the post as deleted
        nextPosts[post.id] = {
            ...posts[post.id],
            state: Posts.POST_DELETED,
            file_ids: [],
            has_reactions: false,
        };

        // Remove any of its comments
        const channelPosts = postsInChannel[channelId] ? [...postsInChannel[channelId]] : [];
        const postsForChannel = [...channelPosts]; // make sure we don't modify the array we loop over
        for (const id of channelPosts) {
            if (nextPosts[id].root_id === post.id) {
                Reflect.deleteProperty(nextPosts, id);

                const commentIndex = postsForChannel.indexOf(id);
                if (commentIndex !== -1) {
                    postsForChannel.splice(commentIndex, 1);
                }
            }
        }

        nextPostsForChannel[channelId] = postsForChannel;

        if (postsInThread[post.id]) {
            nextPostsForThread = {...postsInThread};
            Reflect.deleteProperty(nextPostsForThread, post.id);
        }
    }

    return {posts: nextPosts, postsInChannel: nextPostsForChannel, postsInThread: nextPostsForThread};
}

function handleRemovePost(posts = {}, postsInChannel = {}, postsInThread = {}, action) {
    const post = action.data;
    const channelId = post.channel_id;

    let nextPosts = posts;
    let nextPostsForChannel = postsInChannel;
    let nextPostsForThread;

    // We only need to do something if already have the post
    if (nextPosts[post.id]) {
        nextPosts = {...posts};
        nextPostsForChannel = {...postsInChannel};
        const channelPosts = postsInChannel[channelId] ? [...postsInChannel[channelId]] : [];

        // Remove the post itself
        Reflect.deleteProperty(nextPosts, post.id);

        const index = channelPosts.indexOf(post.id);
        if (index !== -1) {
            channelPosts.splice(index, 1);
        }

        // Create a copy of the channelPosts after we splice the
        // parent post so we can safely loop and have the latest changes
        const postsForChannel = [...channelPosts];

        // Remove any of its comments
        for (const id of channelPosts) {
            if (nextPosts[id].root_id === post.id) {
                Reflect.deleteProperty(nextPosts, id);

                const commentIndex = postsForChannel.indexOf(id);
                if (commentIndex !== -1) {
                    postsForChannel.splice(commentIndex, 1);
                }
            }
        }

        nextPostsForChannel[channelId] = postsForChannel;

        if (postsInThread[post.id]) {
            nextPostsForThread = nextPostsForThread || {...postsInThread};
            Reflect.deleteProperty(nextPostsForThread, post.id);
        }

        if (postsInThread[post.root_id]) {
            nextPostsForThread = nextPostsForThread || {...postsInThread};
            const threadPosts = [...postsInThread[post.root_id]];
            const threadIndex = threadPosts.indexOf(post.id);
            if (threadIndex !== -1) {
                threadPosts.splice(threadIndex, 1);
            }
            nextPostsForThread[post.root_id] = threadPosts;
        }
    }

    return {posts: nextPosts, postsInChannel: nextPostsForChannel, postsInThread: nextPostsForThread || postsInThread};
}

function handlePosts(posts = {}, postsInChannel = {}, postsInThread = {}, action) {
    switch (action.type) {
    case PostTypes.RECEIVED_POST: {
        const nextPosts = {...posts};
        nextPosts[action.data.id] = action.data;
        return {
            posts: nextPosts,
            postsInChannel,
            postsInThread,
        };
    }
    case PostTypes.RECEIVED_NEW_POST:
        return handleReceivedPost(posts, postsInChannel, postsInThread, action);
    case PostTypes.REMOVE_PENDING_POST: {
        return handleRemovePendingPost(posts, postsInChannel, postsInThread, action);
    }
    case PostTypes.RECEIVED_POSTS:
        return handleReceivedPosts(posts, postsInChannel, postsInThread, action);
    case PostTypes.POST_DELETED:
        if (action.data) {
            return handlePostDeleted(posts, postsInChannel, postsInThread, action);
        }
        return {posts, postsInChannel, postsInThread};
    case PostTypes.REMOVE_POST:
        return handleRemovePost(posts, postsInChannel, postsInThread, action);

    case SearchTypes.RECEIVED_SEARCH_POSTS:
    case SearchTypes.RECEIVED_SEARCH_FLAGGED_POSTS:
        return handlePostsFromSearch(posts, postsInChannel, postsInThread, action);

    case UserTypes.LOGOUT_SUCCESS:
        return {
            posts: {},
            postsInChannel: {},
            postsInThread: {},
        };
    default:
        return {
            posts,
            postsInChannel,
            postsInThread,
        };
    }
}

function selectedPostId(state = '', action) {
    switch (action.type) {
    case PostTypes.RECEIVED_POST_SELECTED:
        return action.data;
    case UserTypes.LOGOUT_SUCCESS:
        return '';
    default:
        return state;
    }
}

function currentFocusedPostId(state = '', action) {
    switch (action.type) {
    case PostTypes.RECEIVED_FOCUSED_POST:
        return action.data;
    case UserTypes.LOGOUT_SUCCESS:
        return '';
    default:
        return state;
    }
}

function reactions(state = {}, action) {
    switch (action.type) {
    case PostTypes.RECEIVED_REACTIONS: {
        const reactionsList = action.data;
        const nextReactions = {};
        reactionsList.forEach((reaction) => {
            nextReactions[reaction.user_id + '-' + reaction.emoji_name] = reaction;
        });

        return {
            ...state,
            [action.postId]: nextReactions,
        };
    }
    case PostTypes.RECEIVED_REACTION: {
        const reaction = action.data;
        const nextReactions = {...(state[reaction.post_id] || {})};
        nextReactions[reaction.user_id + '-' + reaction.emoji_name] = reaction;

        return {
            ...state,
            [reaction.post_id]: nextReactions,
        };
    }
    case PostTypes.REACTION_DELETED: {
        const reaction = action.data;
        const nextReactions = {...(state[reaction.post_id] || {})};
        if (!nextReactions[reaction.user_id + '-' + reaction.emoji_name]) {
            return state;
        }

        Reflect.deleteProperty(nextReactions, reaction.user_id + '-' + reaction.emoji_name);

        return {
            ...state,
            [reaction.post_id]: nextReactions,
        };
    }
    case PostTypes.POST_DELETED:
    case PostTypes.REMOVE_POST: {
        const post = action.data;

        if (post && state[post.id]) {
            const nextState = {...state};
            Reflect.deleteProperty(nextState, post.id);

            return nextState;
        }

        return state;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function openGraph(state = {}, action) {
    switch (action.type) {
    case PostTypes.RECEIVED_OPEN_GRAPH_METADATA: {
        const nextState = {...state};
        nextState[action.url] = action.data;

        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function messagesHistory(state = {}, action) {
    switch (action.type) {
    case PostTypes.ADD_MESSAGE_INTO_HISTORY: {
        const nextIndex = {};
        let nextMessages = state.messages ? [...state.messages] : [];
        nextMessages.push(action.data);
        nextIndex[Posts.MESSAGE_TYPES.POST] = nextMessages.length;
        nextIndex[Posts.MESSAGE_TYPES.COMMENT] = nextMessages.length;

        if (nextMessages.length > Posts.MAX_PREV_MSGS) {
            nextMessages = nextMessages.slice(1, Posts.MAX_PREV_MSGS + 1);
        }

        return {
            messages: nextMessages,
            index: nextIndex,
        };
    }
    case PostTypes.RESET_HISTORY_INDEX: {
        const index = {};
        index[Posts.MESSAGE_TYPES.POST] = -1;
        index[Posts.MESSAGE_TYPES.COMMENT] = -1;

        const messages = state.messages || [];
        const nextIndex = state.index ? {...state.index} : index;
        nextIndex[action.data] = messages.length;
        return {
            messages: state.messages,
            index: nextIndex,
        };
    }
    case PostTypes.MOVE_HISTORY_INDEX_BACK: {
        const index = {};
        index[Posts.MESSAGE_TYPES.POST] = -1;
        index[Posts.MESSAGE_TYPES.COMMENT] = -1;

        const nextIndex = state.index ? {...state.index} : index;
        if (nextIndex[action.data] > 0) {
            nextIndex[action.data]--;
        }
        return {
            messages: state.messages,
            index: nextIndex,
        };
    }
    case PostTypes.MOVE_HISTORY_INDEX_FORWARD: {
        const index = {};
        index[Posts.MESSAGE_TYPES.POST] = -1;
        index[Posts.MESSAGE_TYPES.COMMENT] = -1;

        const messages = state.messages || [];
        const nextIndex = state.index ? {...state.index} : index;
        if (nextIndex[action.data] < messages.length) {
            nextIndex[action.data]++;
        }
        return {
            messages: state.messages,
            index: nextIndex,
        };
    }
    case UserTypes.LOGOUT_SUCCESS: {
        const index = {};
        index[Posts.MESSAGE_TYPES.POST] = -1;
        index[Posts.MESSAGE_TYPES.COMMENT] = -1;

        return {
            messages: [],
            index,
        };
    }
    default:
        return state;
    }
}

export default function(state = {}, action) {
    const {posts, postsInChannel, postsInThread} = handlePosts(state.posts, state.postsInChannel, state.postsInThread, action);

    const nextState = {

        // Object mapping post ids to post objects
        posts,

        // Array that contains the pending post ids for those messages that are in transition to being created
        pendingPostIds: handlePendingPosts(state.pendingPostIds, action),

        // Object mapping channel ids to an array of posts ids in that channel with the most recent post first
        postsInChannel,

        // Object mapping post root ids to an array of posts ids in that thread with no guaranteed order
        postsInThread,

        // The current selected post
        selectedPostId: selectedPostId(state.selectedPostId, action),

        // The current selected focused post (permalink view)
        currentFocusedPostId: currentFocusedPostId(state.currentFocusedPostId, action),

        // Object mapping post ids to an object of emoji reactions using userId-emojiName as keys
        reactions: reactions(state.reactions, action),

        // Object mapping URLs to their relevant opengraph metadata for link previews
        openGraph: openGraph(state.openGraph, action),

        // History of posts and comments
        messagesHistory: messagesHistory(state.messagesHistory, action),
    };

    if (state.posts === nextState.posts && state.postsInChannel === nextState.postsInChannel &&
        state.postsInThread === nextState.postsInThread &&
        state.pendingPostIds === nextState.pendingPostIds &&
        state.selectedPostId === nextState.selectedPostId &&
        state.currentFocusedPostId === nextState.currentFocusedPostId &&
        state.reactions === nextState.reactions &&
        state.openGraph === nextState.openGraph &&
        state.messagesHistory === nextState.messagesHistory) {
        // None of the children have changed so don't even let the parent object change
        return state;
    }

    return nextState;
}
