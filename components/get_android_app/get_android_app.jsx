// Copyright (c) 2016-present TinkerTech, Inc. All Rights Reserved.
// See License.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

import {useSafeUrl} from 'utils/url';
import MattermostIcon from 'images/favicon/android-chrome-192x192.png';
import Nexus6Mockup from 'images/nexus-6p-mockup.png';

export default function GetAndroidApp({androidAppDownloadLink}) {
    return (
        <div className='get-app get-android-app'>
            <h1 className='get-app__header'>
                <FormattedMessage
                    id='get_app.androidHeader'
                    defaultMessage='Messenger works best if you switch to our Android app'
                />
            </h1>
            <hr/>
            <div>
                <img
                    className='get-android-app__icon'
                    src={MattermostIcon}
                />
                <div className='get-android-app__app-info'>
                    <span className='get-android-app__app-name'>
                        <FormattedMessage
                            id='get_app.androidAppName'
                            defaultMessage='Messenger for Android'
                        />
                    </span>
                    <span className='get-android-app__app-creator'>
                        <FormattedMessage
                            id='get_app.mattermostInc'
                            defaultMessage='Messenger, Inc'
                        />
                    </span>
                </div>
            </div>
            <a
                className='btn btn-primary get-android-app__continue'
                href={useSafeUrl(androidAppDownloadLink)}
            >
                <FormattedMessage
                    id='get_app.continue'
                    defaultMessage='Continue'
                />
            </a>
            <img
                className='get-app__screenshot'
                src={Nexus6Mockup}
            />
            <span className='get-app__continue-with-browser'>
                <FormattedMessage
                    id='get_app.continueWithBrowser'
                    defaultMessage='Or {link}'
                    values={{
                        link: (
                            <Link to='/switch_team'>
                                <FormattedMessage
                                    id='get_app.continueWithBrowserLink'
                                    defaultMessage='continue with browser'
                                />
                            </Link>
                        ),
                    }}
                />
            </span>
        </div>
    );
}

GetAndroidApp.propTypes = {
    androidAppDownloadLink: PropTypes.string,
};
