// Copyright (c) 2015-present TinkerTech, Inc. All Rights Reserved.
// See License.txt for license information.

const ru = require('!!file-loader?name=i18n/[name].[hash].[ext]!./ru.json');

import {addLocaleData} from 'react-intl';
import enLocaleData from 'react-intl/locale-data/en';
import ruLocaleData from 'react-intl/locale-data/ru';
import {getConfig} from 'mattermost-redux/selectors/entities/general';

import store from 'stores/redux_store.jsx';

// should match the values in model/config.go
const languages = {
    en: {
        value: 'en',
        name: 'English',
        order: 1,
        url: '',
    },
    ru: {
        value: 'ru',
        name: 'Pусский (Alpha)',
        order: 2,
        url: ru,
    },
};

export function getAllLanguages() {
    return languages;
}

export function getLanguages() {
    const config = getConfig(store.getState());
    if (!config.AvailableLocales) {
        return getAllLanguages();
    }

    return config.AvailableLocales.split(',').filter((l) => languages[l]).map((l) => languages[l]);
}

export function getLanguageInfo(locale) {
    return getAllLanguages()[locale];
}

export function isLanguageAvailable(locale) {
    return Boolean(getLanguages()[locale]);
}

export function safariFix(callback) {
    require.ensure([
        'intl',
        'intl/locale-data/jsonp/en.js',
        'intl/locale-data/jsonp/ru.js',
    ], (require) => {
        require('intl');
        require('intl/locale-data/jsonp/en.js');
        require('intl/locale-data/jsonp/ru.js');
        callback();
    });
}

export function doAddLocaleData() {
    addLocaleData(enLocaleData);
    addLocaleData(ruLocaleData);
}
