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
        func: () => emitKeyboardEvent(false, true, false, false, Constants.KeyCodes.UP),
        text: 'shortcuts.nav.prev',
    },
    next_channel: {
        func: () => emitKeyboardEvent(false, true, false, false, Constants.KeyCodes.DOWN),
        text: 'shortcuts.nav.next'
    },
    prev_unread_channel: {
        func: () => emitKeyboardEvent(false, true, true, false, Constants.KeyCodes.UP),
        text: 'shortcuts.nav.unread_prev',
    },
    next_unread_channel: {
        func: () => emitKeyboardEvent(false, true, true, false, Constants.KeyCodes.DOWN),
        text: 'shortcuts.nav.unread_next'
    },
    direct_messages: {
        func: () => emitKeyboardEvent(true, false, true, false, Constants.KeyCodes.K),
        text: 'shortcuts.nav.direct_messages_menu'
    },
    settings: {
        func: () => emitKeyboardEvent(true, false, true, false, Constants.KeyCodes.A),
        text: 'shortcuts.nav.settings'
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
