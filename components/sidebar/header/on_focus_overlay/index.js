// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {getCurrentUserId, getStatusForUserId} from 'mattermost-redux/selectors/entities/users';
import {setStatus} from 'mattermost-redux/actions/users';

import OnFocusOverlay from './on_focus_overlay.jsx';

function mapStateToProps(state) {
    const userId = getCurrentUserId(state) || '';
    const status = getStatusForUserId(state, userId);

    return {
        userId,
        status,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            setStatus,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(OnFocusOverlay);
