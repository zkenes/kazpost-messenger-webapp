// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import React from 'react';

import * as UserAgent from 'utils/user_agent';

export default class Home extends React.PureComponent {
    componentDidMount() {
        $('body').addClass('app__body');

        // IE Detection
        if (UserAgent.isInternetExplorer() || UserAgent.isEdge()) {
            $('body').addClass('browser--ie');
        }
    }

    componentWillUnmount() {
        $('body').removeClass('app__body');
    }

    render() {
        return (
            <div
                id='app-content'
                className='app__content'
            >
                <h1 style={{color: 'red'}}>{'Home!'}</h1>
            </div>
        );
    }
}
