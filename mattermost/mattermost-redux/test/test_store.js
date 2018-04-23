// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
import {AsyncNodeStorage} from 'redux-persist-node-storage';
import {createTransform, persistStore} from 'redux-persist';

import configureStore from 'store';

export default async function testConfigureStore(preloadedState) {
    const storageTransform = createTransform(
        () => ({}),
        () => ({})
    );

    const offlineConfig = {
        detectNetwork: (callback) => callback(true),
        persist: (store, options) => {
            return persistStore(store, {storage: new AsyncNodeStorage('./.tmp'), ...options});
        },
        persistOptions: {
            debounce: 1000,
            transforms: [
                storageTransform,
            ],
            whitelist: [],
        },
        retry: (action, retries) => 200 * (retries + 1),
        discard: (error, action, retries) => {
            if (action.meta && action.meta.offline.hasOwnProperty('maxRetry')) {
                return retries >= action.meta.offline.maxRetry;
            }

            return retries >= 1;
        },
    };

    const store = configureStore(preloadedState, {}, offlineConfig, () => ({}), {enableBuffer: false});

    const wait = () => new Promise((resolve) => setTimeout(resolve), 300); //eslint-disable-line
    await wait();

    return store;
}
