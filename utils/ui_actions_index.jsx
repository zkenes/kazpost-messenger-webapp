import lunr from 'lunr';
import FlagIcon from 'components/svg/flag_icon';
import MentionsIcon from 'components/svg/mentions_icon';
import PinIcon from 'components/svg/pin_icon';
import MemberIcon from 'components/svg/member_icon';
import {showFlaggedPosts, showPinnedPosts, showMentions} from 'actions/views/rhs.js';
import * as GlobalActions from 'actions/global_actions.jsx';
import {Constants} from 'utils/constants.jsx';
import $ from 'jquery';

function emitKeyboardEvent(ctrlKey, altKey, shiftKey, metaKey, keyCode) {
    const e = $.Event('keydown');
    e.which = keyCode; // enter
    e.keyCode = keyCode; // enter
    e.ctrlKey = ctrlKey;
    e.altKey = altKey;
    e.shiftKey = shiftKey;
    e.metaKey = metaKey;
    $(document).trigger(e);
}

export const mappingSectionsToTexts = {
    pinned_posts: {
        action: showPinnedPosts(),
        icon: PinIcon,
        text: 'channel_header.pinnedPosts',
    },
    flagged_posts: {
        action: showFlaggedPosts(),
        icon: FlagIcon,
        text: 'channel_header.flagged',
    },
    mentions: {
        action: showMentions(),
        icon: MentionsIcon,
        text: 'shortcuts.nav.recent_mentions',
    },
    shortcuts: {
        func: GlobalActions.toggleShortcutsModal,
        text: 'shortcuts.header',
    },
    prev_channel: {
        icon: 'fa-angle-left',
        func: () => emitKeyboardEvent(false, true, false, false, Constants.KeyCodes.UP),
        text: 'shortcuts.nav.prev',
    },
    next_channel: {
        icon: 'fa-angle-right',
        func: () => emitKeyboardEvent(false, true, false, false, Constants.KeyCodes.DOWN),
        text: 'shortcuts.nav.next'
    },
    prev_unread_channel: {
        icon: 'fa-angle-double-left',
        func: () => emitKeyboardEvent(false, true, true, false, Constants.KeyCodes.UP),
        text: 'shortcuts.nav.unread_prev',
    },
    next_unread_channel: {
        icon: 'fa-angle-double-right',
        func: () => emitKeyboardEvent(false, true, true, false, Constants.KeyCodes.DOWN),
        text: 'shortcuts.nav.unread_next'
    },
    direct_messages: {
        icon: 'fa-plus',
        func: () => emitKeyboardEvent(true, false, true, false, Constants.KeyCodes.K),
        text: 'shortcuts.nav.direct_messages_menu'
    },
    settings: {
        icon: 'fa-gear',
        func: () => emitKeyboardEvent(true, false, true, false, Constants.KeyCodes.A),
        text: 'shortcuts.nav.settings'
    },
    create_team: {
        icon: 'fa-plus',
        func: () => {},
        text: 'navbar_dropdown.create'
    },
    create_public_channel: {
        icon: 'fa-plus',
        func: () => {},
        text: 'sidebar.createChannel'
    },
    create_private_channel: {
        icon: 'fa-plus',
        func: () => {},
        text: 'sidebar.createGroup'
    },
    user_guide: {
        icon: 'fa-book',
        func: () => {window.open('https://docs.mattermost.com/guides/user.html')},
        text: 'spotlight.user_guide'
    },
    developer_guide: {
        icon: 'fa-book',
        func: () => {window.open('https://docs.mattermost.com/guides/developer.html')},
        text: 'spotlight.developer_guide'
    },
    administrator_guide: {
        icon: 'fa-book',
        func: () => {window.open('https://docs.mattermost.com/guides/administrator.html')},
        text: 'spotlight.administrator_guide'
    },
    integration_guide: {
        icon: 'fa-book',
        func: () => {window.open('https://docs.mattermost.com/guides/integration.html')},
        text: 'spotlight.integration_guide'
    },
    core_team_handbook: {
        icon: 'fa-book',
        func: () => {window.open('https://docs.mattermost.com/guides/core.html')},
        text: 'spotlight.core_team_handbook'
    },
};

export function generateIndex(intl) {
    var idx = lunr(function () {
        this.ref('ref');
        this.field('text');
        for (const key of Object.keys(mappingSectionsToTexts)) {
            const str = mappingSectionsToTexts[key].text;
            const text = intl.formatMessage({id: str});
            this.add({ref: key, text, url: mappingSectionsToTexts[key].url});
        }
    });
    return idx;
}
