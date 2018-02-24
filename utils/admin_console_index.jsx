import lunr from "lunr";
import {intlShape} from 'react-intl';

const mappingSectionsToTexts = {
    'audits': [
        'admin.audits.title',
        'admin.audits.reload',
    ],
    'authentication_email': [
        'admin.email.allowSignupTitle',
        'admin.email.allowSignupDescription',
        'admin.email.allowEmailSignInTitle',
        'admin.email.allowEmailSignInDescription',
        'admin.email.allowUsernameSignInTitle',
        'admin.email.allowUsernameSignInDescription',
    ],
    'client_versions': [
        'admin.client_versions.androidLatestVersion',
        'admin.client_versions.androidLatestVersionHelp',
        'admin.client_versions.androidMinVersion',
        'admin.client_versions.androidMinVersionHelp',
        'admin.client_versions.desktopLatestVersion',
        'admin.client_versions.desktopLatestVersionHelp',
        'admin.client_versions.desktopMinVersion',
        'admin.client_versions.desktopMinVersionHelp',
        'admin.client_versions.iosLatestVersion',
        'admin.client_versions.iosLatestVersionHelp',
        'admin.client_versions.iosMinVersion',
        'admin.client_versions.iosMinVersionHelp',
    ],
    'cluster': [
        'admin.cluster.loadedFrom',
        'admin.cluster.should_not_change',
        'admin.cluster.noteDescription',
        'admin.cluster.enableDescription',
        'admin.cluster.ClusterName',
        'admin.cluster.ClusterNameDesc',
        'admin.cluster.OverrideHostname',
        'admin.cluster.OverrideHostnameDesc',
        'admin.cluster.UseIpAddress',
        'admin.cluster.UseIpAddressDesc',
        'admin.cluster.UseExperimentalGossip',
        'admin.cluster.UseExperimentalGossipDesc',
        'admin.cluster.ReadOnlyConfig',
        'admin.cluster.ReadOnlyConfigDesc',
        'admin.cluster.GossipPort',
        'admin.cluster.GossipPortDesc',
        'admin.cluster.StreamingPort',
        'admin.cluster.StreamingPortDesc',
    ],
    'compliance': [
        'admin.compliance.noLicense',
        'admin.compliance.enableTitle',
        'admin.compliance.enableDesc',
        'admin.compliance.directoryTitle',
        'admin.compliance.directoryDescription',
        'admin.compliance.enableDailyTitle',
        'admin.compliance.enableDailyDesc',
    ],
    'configuration': [
    ],
    'connections': [
    ],
    'custom_brand': [
    ],
    'database': [
    ],
    'data_retention': [
    ],
    'developer': [
    ],
    'elasticsearch': [
    ],
    'emoji': [
    ],
    'gitlab': [
    ],
    'integrations.custom': [
    ],
    'integrations.external': [
    ],
    'ldap': [
    ],
    'legal_and_support': [
    ],
    'license': [
    ],
    'link_previews': [
    ],
    'localization': [
    ],
    'logging': [
    ],
    'logs': [
    ],
    'message_export': [
    ],
    'metrics': [
    ],
    'mfa': [
    ],
    'native_app_links': [
    ],
    'notifications_email': [
    ],
    'oauth': [
    ],
    'password': [
    ],
    'plugins.configuration': [
    ],
    'plugins.management': [
    ],
    'policy': [
    ],
    'privacy': [
    ],
    'public_links': [
    ],
    'push': [
    ],
    'rate': [
    ],
    'saml': [
    ],
    'sessions': [
    ],
    'sign_up': [
    ],
    'storage': [
    ],
    'system_analytics': [
    ],
    'team_analytics': [
    ],
    'users': [
    ],
    'users_and_teams': [
    ],
    'webrtc': [
    ],
}

export function generateIndex(intl) {
    var idx = lunr(function () {
        this.ref('ref')
        this.field('text')
        for (let key of Object.keys(mappingSectionsToTexts)) {
            let text = "";
            for (let str of mappingSectionsToTexts[key]) {
                text += " "+intl.formatMessage({id: str})
            }
            this.add({ref: key, text})
        }
    })
    return idx;
}
