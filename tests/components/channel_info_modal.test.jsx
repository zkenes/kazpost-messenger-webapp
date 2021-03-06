// Copyright (c) 2015-present TinkerTech, Inc. All Rights Reserved.
// See License.txt for license information.

import React from 'react';
import {Modal} from 'react-bootstrap';
import {shallow} from 'enzyme';

import {mountWithIntl} from 'tests/helpers/intl-test-helper.jsx';
import ChannelInfoModal from 'components/channel_info_modal/channel_info_modal.jsx';

describe('components/ChannelInfoModal', () => {
    test('should match snapshot', () => {
        function emptyFunction() {} //eslint-disable-line no-empty-function

        const wrapper = shallow(
            <ChannelInfoModal
                channel={{name: 'testchannel', displayName: 'testchannel', header: '', purpose: ''}}
                currentTeam={{id: 'testid', name: 'testteam'}}
                onHide={emptyFunction}
            />
        );

        expect(wrapper).toMatchSnapshot();
    });

    test('should call onHide callback when modal is hidden', (done) => {
        function onHide() {
            done();
        }

        const wrapper = mountWithIntl(
            <ChannelInfoModal
                channel={{name: 'testchannel', displayName: 'testchannel', header: '', purpose: ''}}
                currentTeam={{id: 'testid', name: 'testteam'}}
                onHide={onHide}
            />
        );

        wrapper.find(Modal).first().props().onExited();
    });
});
