// Copyright (c) 2016-present TinkerTech, Inc. All Rights Reserved.
// See License.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

import {useSafeUrl} from 'utils/url';
import AppStoreButton from 'images/app-store-button.png';
import IPhone6Mockup from 'images/iphone-6-mockup.png';

export default function GetIosApp({iosAppDownloadLink}) {
    return (
        <div className='get-app get-ios-app'>
            <h1 className='get-app__header'>
                <FormattedMessage
                    id='get_app.iosHeader'
                    defaultMessage='Messenger works best if you switch to our iPhone app'
                />
            </h1>
            <hr/>
            <a
                className='get-ios-app__app-store-link'
                href={useSafeUrl(iosAppDownloadLink)}
                rel='noopener noreferrer'
            >
                <img src={AppStoreButton}/>
            </a>
            <img
                className='get-app__screenshot'
                src={IPhone6Mockup}
            />
            <h2 className='get-ios-app__already-have-it'>
                <FormattedMessage
                    id='get_app.alreadyHaveIt'
                    defaultMessage='Already have it?'
                />
            </h2>
            <a
                className='btn btn-primary get-ios-app__open-Messenger'
                href='Messenger://'
            >
                <FormattedMessage
                    id='get_app.openMattermost'
                    defaultMessage='Open Messenger'
                />
            </a>
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

GetIosApp.propTypes = {
    iosAppDownloadLink: PropTypes.string,
};
