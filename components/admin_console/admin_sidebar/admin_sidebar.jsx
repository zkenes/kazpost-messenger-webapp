// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import $ from 'jquery';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {intlShape} from 'react-intl';

import {generateIndex} from 'utils/admin_console_index.jsx';
import * as Utils from 'utils/utils.jsx';
import AdminSidebarCategory from 'components/admin_console/admin_sidebar_category.jsx';
import AdminSidebarHeader from 'components/admin_console/admin_sidebar_header.jsx';
import AdminSidebarSection from 'components/admin_console/admin_sidebar_section.jsx';

export default class AdminSidebar extends React.Component {
    static get contextTypes() {
        return {
            router: PropTypes.object.isRequired,
        };
    }

    static propTypes = {
        license: PropTypes.object.isRequired,
        config: PropTypes.object,
        plugins: PropTypes.object,
        buildEnterpriseReady: PropTypes.bool,
        siteName: PropTypes.string,
        onFilterChange: PropTypes.func.isRequired,
        intl: intlShape.isRequired,
        actions: PropTypes.shape({

            /*
             * Function to get installed plugins
             */
            getPlugins: PropTypes.func.isRequired,
        }).isRequired,
    }

    static defaultProps = {
        plugins: {},
    }

    constructor(props) {
        super(props)
        this.state = {
            sections: null,
        }
        this.idx = null;
    }

    componentDidMount() {
        if (this.props.config.PluginSettings.Enable) {
            this.props.actions.getPlugins();
        }

        this.updateTitle();

        if (!Utils.isMobile()) {
            $('.admin-sidebar .nav-pills__container').perfectScrollbar({
                suppressScrollX: true,
            });
        }
    }

    componentDidUpdate() {
        if (!Utils.isMobile()) {
            $('.admin-sidebar .nav-pills__container').perfectScrollbar({
                suppressScrollX: true,
            });
        }
    }

    updateTitle = () => {
        let currentSiteName = '';
        if (this.props.siteName) {
            currentSiteName = ' - ' + this.props.siteName;
        }

        document.title = Utils.localizeMessage('sidebar_right_menu.console', 'System Console') + currentSiteName;
    }

    onFilterChange = (e) => {
        const filter = e.target.value;
        if (filter === "") {
            this.setState({sections: null})
            this.props.onFilterChange(filter);
            return;
        }

        if (this.idx === null) {
            this.idx = generateIndex(this.props.intl);
        }
        let query = ""
        for (let term of filter.split(" ")) {
            query += term+"* "
        }
        const sections = this.idx.search(query).map((result) => result.ref);
        this.setState({sections})
        this.props.onFilterChange(filter);
    }

    mustHideSection = (...sections) => {
        if (this.state.sections === null) {
            return false;
        }
        for (let section of sections) {
            if (this.state.sections.indexOf(section) !== -1) {
                console.log(sections, false)
                return false;
            }
        }
        return true;
    }

    render() {
        let oauthSettings = null;
        let ldapSettings = null;
        let samlSettings = null;
        let clusterSettings = null;
        let metricsSettings = null;
        let complianceSettings = null;
        let mfaSettings = null;
        let messageExportSettings = null;
        let complianceSection = null;

        let license = null;
        let audits = null;
        let policy = null;

        if (this.props.buildEnterpriseReady) {
            license = (
                <AdminSidebarSection
                    name='license'
                    hide={this.mustHideSection('license')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.license'
                            defaultMessage='Edition and License'
                        />
                    }
                />
            );
        }

        if (this.props.license.IsLicensed === 'true') {
            if (this.props.license.LDAP === 'true') {
                ldapSettings = (
                    <AdminSidebarSection
                        hide={this.mustHideSection('ldap')}
                        name='ldap'
                        title={
                            <FormattedMessage
                                id='admin.sidebar.ldap'
                                defaultMessage='AD/LDAP'
                            />
                        }
                    />
                );
            }

            if (this.props.license.Cluster === 'true') {
                clusterSettings = (
                    <AdminSidebarSection
                        name='cluster'
                        hide={this.mustHideSection('cluster')}
                        title={
                            <FormattedMessage
                                id='admin.sidebar.cluster'
                                defaultMessage='High Availability'
                            />
                        }
                    />
                );
            }

            if (this.props.license.Metrics === 'true') {
                metricsSettings = (
                    <AdminSidebarSection
                        name='metrics'
                        hide={this.mustHideSection('metrics')}
                        title={
                            <FormattedMessage
                                id='admin.sidebar.metrics'
                                defaultMessage='Performance Monitoring'
                            />
                        }
                    />
                );
            }

            if (this.props.license.SAML === 'true') {
                samlSettings = (
                    <AdminSidebarSection
                        name='saml'
                        hide={this.mustHideSection('saml')}
                        title={
                            <FormattedMessage
                                id='admin.sidebar.saml'
                                defaultMessage='SAML 2.0'
                            />
                        }
                    />
                );
            }

            if (this.props.license.Compliance === 'true') {
                complianceSettings = (
                    <AdminSidebarSection
                        name='compliance'
                        hide={this.mustHideSection('compliance')}
                        title={
                            <FormattedMessage
                                id='admin.sidebar.compliance'
                                defaultMessage='Compliance'
                            />
                        }
                    />
                );
            }

            if (this.props.license.MFA === 'true') {
                mfaSettings = (
                    <AdminSidebarSection
                        name='mfa'
                        hide={this.mustHideSection('mfa')}
                        title={
                            <FormattedMessage
                                id='admin.sidebar.mfa'
                                defaultMessage='MFA'
                            />
                        }
                    />
                );
            }

            if (this.props.license.MessageExport === 'true') {
                messageExportSettings = (
                    <AdminSidebarSection
                        name='message_export'
                        hide={this.mustHideSection('message_export')}
                        title={
                            <FormattedMessage
                                id='admin.sidebar.compliance_export'
                                defaultMessage='Compliance Export (Beta)'
                            />
                        }
                    />
                );
            }

            oauthSettings = (
                <AdminSidebarSection
                    name='oauth'
                    hide={this.mustHideSection('oauth')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.oauth'
                            defaultMessage='OAuth 2.0'
                        />
                    }
                />
            );

            policy = (
                <AdminSidebarSection
                    name='policy'
                    hide={this.mustHideSection('policy')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.policy'
                            defaultMessage='Policy'
                        />
                    }
                />
            );
        } else {
            oauthSettings = (
                <AdminSidebarSection
                    name='gitlab'
                    hide={this.mustHideSection('gitlab')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.gitlab'
                            defaultMessage='GitLab'
                        />
                    }
                />
            );
        }

        if (this.props.license.IsLicensed === 'true') {
            audits = (
                <AdminSidebarSection
                    name='audits'
                    hide={this.mustHideSection('audits')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.audits'
                            defaultMessage='Complaince and Auditing'
                        />
                    }
                />
            );
        }

        let customBranding = null;

        if (this.props.license.IsLicensed === 'true') {
            customBranding = (
                <AdminSidebarSection
                    name='custom_brand'
                    hide={this.mustHideSection('custom_brand')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.customBrand'
                            defaultMessage='Custom Branding'
                        />
                    }
                />
            );
        }

        let otherCategory = null;
        if (license || audits) {
            otherCategory = (
                <AdminSidebarCategory
                    parentLink='/admin_console'
                    icon='fa-wrench'
                    title={
                        <FormattedMessage
                            id='admin.sidebar.other'
                            defaultMessage='OTHER'
                        />
                    }
                >
                    {license}
                    {audits}
                </AdminSidebarCategory>
            );
        }

        const webrtcSettings = (
            <AdminSidebarSection
                name='webrtc'
                hide={this.mustHideSection('webrtc')}
                title={
                    <FormattedMessage
                        id='admin.sidebar.webrtc'
                        defaultMessage='WebRTC (Beta)'
                    />
                }
            />
        );

        let elasticSearchSettings = null;
        if (this.props.license.IsLicensed === 'true' && this.props.license.Elasticsearch === 'true') {
            elasticSearchSettings = (
                <AdminSidebarSection
                    name='elasticsearch'
                    hide={this.mustHideSection('elasticsearch')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.elasticsearch'
                            defaultMessage='Elasticsearch (Beta)'
                        />
                    }
                />
            );
        }

        let dataRetentionSettings = null;
        if (this.props.license.IsLicensed === 'true' && this.props.license.DataRetention === 'true') {
            dataRetentionSettings = (
                <AdminSidebarSection
                    name='data_retention'
                    hide={this.mustHideSection('data_retention')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.data_retention'
                            defaultMessage='Data Retention Policy (Beta)'
                        />
                    }
                />
            );
        }

        const SHOW_CLIENT_VERSIONS = false;
        let clientVersions = null;
        if (SHOW_CLIENT_VERSIONS) {
            clientVersions = (
                <AdminSidebarSection
                    name='client_versions'
                    hide={this.mustHideSection('client_versions')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.client_versions'
                            defaultMessage='Client Versions'
                        />
                    }
                />
            );
        }

        if (dataRetentionSettings || messageExportSettings) {
            complianceSection = (
                <AdminSidebarSection
                    name='compliance'
                    type='text'
                    hide={this.mustHideSection('data_retention', 'message_export')}
                    title={
                        <FormattedMessage
                            id='admin.sidebar.compliance'
                            defaultMessage='Compliance'
                        />
                    }
                >
                    {dataRetentionSettings}
                    {messageExportSettings}
                </AdminSidebarSection>
            );
        }

        const customPlugins = [];
        if (this.props.config.PluginSettings.Enable) {
            Object.values(this.props.plugins).forEach((p) => {
                if (!p.settings_schema || Object.keys(p.settings_schema) === 0) {
                    return;
                }

                customPlugins.push(
                    <AdminSidebarSection
                        key={'customplugin' + p.id}
                        name={'custom/' + p.id}
                        title={p.name}
                    />
                );
            });
        }

        return (
            <div className='admin-sidebar'>
                <AdminSidebarHeader/>
                <div className='nav-pills__container'>
                    <ul className='nav nav-pills nav-stacked'>
                        <li>
                            <input className='filter' type='text' onKeyUp={this.onFilterChange} placeholder='Filter' />
                        </li>

                        <AdminSidebarCategory
                            parentLink='/admin_console'
                            icon='fa-bar-chart'
                            title={
                                <FormattedMessage
                                    id='admin.sidebar.reports'
                                    defaultMessage='REPORTING'
                                />
                            }
                        >
                            <AdminSidebarSection
                                name='system_analytics'
                                hide={this.mustHideSection('system_analytics')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.view_statistics'
                                        defaultMessage='Site Statistics'
                                    />
                                }
                            />
                            <AdminSidebarSection
                                name='team_analytics'
                                hide={this.mustHideSection('team_analytics')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.statistics'
                                        defaultMessage='Team Statistics'
                                    />
                                }
                            />
                            <AdminSidebarSection
                                name='users'
                                hide={this.mustHideSection('users')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.users'
                                        defaultMessage='Users'
                                    />
                                }
                            />
                            <AdminSidebarSection
                                name='logs'
                                hide={this.mustHideSection('logs')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.logs'
                                        defaultMessage='Logs'
                                    />
                                }
                            />
                        </AdminSidebarCategory>
                        <AdminSidebarCategory
                            sectionClass='sections--settings'
                            parentLink='/admin_console'
                            icon='fa-gear'
                            title={
                                <FormattedMessage
                                    id='admin.sidebar.settings'
                                    defaultMessage='SETTINGS'
                                />
                            }
                        >
                            <AdminSidebarSection
                                name='general'
                                type='text'
                                hide={this.mustHideSection('configuration', 'localization', 'users_and_teams', 'privacy', 'logging')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.general'
                                        defaultMessage='General'
                                    />
                                }
                            >
                                <AdminSidebarSection
                                    name='configuration'
                                    hide={this.mustHideSection('configuration')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.configuration'
                                            defaultMessage='Configuration'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='localization'
                                    hide={this.mustHideSection('localization')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.localization'
                                            defaultMessage='Localization'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='users_and_teams'
                                    hide={this.mustHideSection('users_and_teams')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.usersAndTeams'
                                            defaultMessage='Users and Teams'
                                        />
                                    }
                                />
                                {policy}
                                <AdminSidebarSection
                                    name='privacy'
                                    hide={this.mustHideSection('privacy')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.privacy'
                                            defaultMessage='Privacy'
                                        />
                                    }
                                />
                                {complianceSettings}
                                <AdminSidebarSection
                                    name='logging'
                                    hide={this.mustHideSection('logging')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.logging'
                                            defaultMessage='Logging'
                                        />
                                    }
                                />
                            </AdminSidebarSection>
                            <AdminSidebarSection
                                name='authentication'
                                hide={this.mustHideSection('authentication_email', 'oauth', 'ldap', 'saml', 'mfa')}
                                type='text'
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.authentication'
                                        defaultMessage='Authentication'
                                    />
                                }
                            >
                                <AdminSidebarSection
                                    name='authentication_email'
                                    hide={this.mustHideSection('authentication_email')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.email'
                                            defaultMessage='Email'
                                        />
                                    }
                                />
                                {oauthSettings}
                                {ldapSettings}
                                {samlSettings}
                                {mfaSettings}
                            </AdminSidebarSection>
                            <AdminSidebarSection
                                name='security'
                                hide={this.mustHideSection('sign_up', 'password', 'public_links', 'sessions', 'connections')}
                                type='text'
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.security'
                                        defaultMessage='Security'
                                    />
                                }
                            >
                                <AdminSidebarSection
                                    name='sign_up'
                                    hide={this.mustHideSection('sign_up')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.signUp'
                                            defaultMessage='Sign Up'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='password'
                                    hide={this.mustHideSection('password')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.password'
                                            defaultMessage='Password'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='public_links'
                                    hide={this.mustHideSection('public_links')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.publicLinks'
                                            defaultMessage='Public Links'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='sessions'
                                    hide={this.mustHideSection('sessions')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.sessions'
                                            defaultMessage='Sessions'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='connections'
                                    hide={this.mustHideSection('connections')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.connections'
                                            defaultMessage='Connections'
                                        />
                                    }
                                />
                                {clientVersions}
                            </AdminSidebarSection>
                            <AdminSidebarSection
                                name='notifications'
                                type='text'
                                hide={this.mustHideSection('notifications_email', 'push')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.notifications'
                                        defaultMessage='Notifications'
                                    />
                                }
                            >
                                <AdminSidebarSection
                                    name='notifications_email'
                                    hide={this.mustHideSection('notifications_email')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.email'
                                            defaultMessage='Email'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='push'
                                    hide={this.mustHideSection('push')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.push'
                                            defaultMessage='Mobile Push'
                                        />
                                    }
                                />
                            </AdminSidebarSection>
                            <AdminSidebarSection
                                name='integrations'
                                type='text'
                                hide={this.mustHideSection('integrations.custom', 'integrations.external')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.integrations'
                                        defaultMessage='Integrations'
                                    />
                                }
                            >
                                <AdminSidebarSection
                                    name='custom'
                                    hide={this.mustHideSection('integrations.custom')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.customIntegrations'
                                            defaultMessage='Custom Integrations'
                                        />
                                    }
                                />
                                {webrtcSettings}
                                <AdminSidebarSection
                                    name='external'
                                    hide={this.mustHideSection('integrations.external')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.external'
                                            defaultMessage='External Services'
                                        />
                                    }
                                />
                            </AdminSidebarSection>
                            <AdminSidebarSection
                                name='plugins'
                                type='text'
                                hide={this.mustHideSection('plugins.configuration', 'plugins.management')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.plugins'
                                        defaultMessage='Plugins (Beta)'
                                    />
                                }
                            >
                                <AdminSidebarSection
                                    name='configuration'
                                    hide={this.mustHideSection('plugins.configuration')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.plugins.configuration'
                                            defaultMessage='Configuration'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='management'
                                    hide={this.mustHideSection('plugins.management')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.plugins.management'
                                            defaultMessage='Management'
                                        />
                                    }
                                />
                                {customPlugins}
                            </AdminSidebarSection>
                            <AdminSidebarSection
                                name='files'
                                type='text'
                                hide={this.mustHideSection('storage')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.files'
                                        defaultMessage='Files'
                                    />
                                }
                            >
                                <AdminSidebarSection
                                    key='storage'
                                    name='storage'
                                    hide={this.mustHideSection('storage')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.storage'
                                            defaultMessage='Storage'
                                        />
                                    }
                                />
                            </AdminSidebarSection>
                            <AdminSidebarSection
                                name='customization'
                                type='text'
                                hide={this.mustHideSection('emoji', 'link_previews', 'custom_brand', 'legal_and_support', 'native_app_links')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.customization'
                                        defaultMessage='Customization'
                                    />
                                }
                            >
                                {customBranding}
                                <AdminSidebarSection
                                    name='emoji'
                                    hide={this.mustHideSection('emoji')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.emoji'
                                            defaultMessage='Emoji'
                                        />

                                    }
                                />
                                <AdminSidebarSection
                                    name='link_previews'
                                    hide={this.mustHideSection('link_previews')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.linkPreviews'
                                            defaultMessage='Link Previews'
                                        />

                                    }
                                />
                                <AdminSidebarSection
                                    name='legal_and_support'
                                    hide={this.mustHideSection('legal_and_support')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.legalAndSupport'
                                            defaultMessage='Legal and Support'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='native_app_links'
                                    hide={this.mustHideSection('native_app_links')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.nativeAppLinks'
                                            defaultMessage='Mattermost App Links'
                                        />

                                    }
                                />
                            </AdminSidebarSection>
                            {complianceSection}
                            <AdminSidebarSection
                                name='advanced'
                                type='text'
                                hide={this.mustHideSection('rate', 'database', 'developer', 'elasticsearch', 'cluster', 'metrics')}
                                title={
                                    <FormattedMessage
                                        id='admin.sidebar.advanced'
                                        defaultMessage='Advanced'
                                    />
                                }
                            >
                                <AdminSidebarSection
                                    name='rate'
                                    hide={this.mustHideSection('rate')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.rateLimiting'
                                            defaultMessage='Rate Limiting'
                                        />
                                    }
                                />
                                <AdminSidebarSection
                                    name='database'
                                    hide={this.mustHideSection('database')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.database'
                                            defaultMessage='Database'
                                        />
                                    }
                                />
                                {elasticSearchSettings}
                                <AdminSidebarSection
                                    name='developer'
                                    hide={this.mustHideSection('developer')}
                                    title={
                                        <FormattedMessage
                                            id='admin.sidebar.developer'
                                            defaultMessage='Developer'
                                        />
                                    }
                                />
                                {clusterSettings}
                                {metricsSettings}
                            </AdminSidebarSection>
                        </AdminSidebarCategory>
                        {otherCategory}
                    </ul>
                </div>
            </div>
        );
    }
}
