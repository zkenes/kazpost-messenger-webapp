// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import {UserStatuses} from 'utils/constants.jsx';

export default class OnFocusOverlay extends React.Component {
    static propTypes = {
        userId: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
    };

    static defaultProps = {
        status: '',
    };

    constructor(props) {
        super(props);
        this.interval = null;
        this.state = {
            countdown: "00:00",
        }
    }

    componentWillUpdate(nextProps, nextState) {
        if (this.props.status !== nextProps.status) {
            if (this.interval !== null) {
                clearInterval(this.interval);
            }
        }
        if (this.props.status !== nextProps.status && nextProps.status === UserStatuses.FOCUS) {
            const endTime= moment.now() + (60*45);
            const diffTime = endTime - Date.now();
            let duration = moment.duration(diffTime*1000, 'milliseconds');
            const interval = 1000;

            duration = moment.duration(duration - interval, 'milliseconds');
            this.setState({
                countdown: duration.minutes() + ":" + duration.seconds()
            });

            this.interval = setInterval(() => {
                duration = moment.duration(duration - interval, 'milliseconds');
                this.setState({
                    countdown: duration.minutes() + ":" + duration.seconds()
                });
            }, interval);
        }
    }

    handleCancel = (e) => {
        e.preventDefault()

        this.props.actions.setStatus({
            user_id: this.props.userId,
            status: UserStatuses.ONLINE
        });
    }

    render() {
        if (this.props.status !== UserStatuses.FOCUS) {
            return null;
        }

        return (
            <div className="on-focus-overlay">
                <h1>Focus mode</h1>
                <h2>{this.state.countdown}</h2>
                <button href="#" className="btn-primary" onClick={this.handleCancel}>Cancel</button>
            </div>
        );
    }
}
