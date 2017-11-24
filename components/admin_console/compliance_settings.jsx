// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import React from 'react';
import {FormattedHTMLMessage, FormattedMessage} from 'react-intl';

import * as Utils from 'utils/utils.jsx';

import AdminSettings from './admin_settings.jsx';
import BooleanSetting from './boolean_setting.jsx';
import SettingsGroup from './settings_group.jsx';
import TextSetting from './text_setting.jsx';

export default class ComplianceSettings extends AdminSettings {
    constructor(props) {
        super(props);

        this.getConfigFromState = this.getConfigFromState.bind(this);

        this.renderSettings = this.renderSettings.bind(this);
    }

    getConfigFromState(config) {
        config.ComplianceSettings.Enable = this.state.enable;
        config.ComplianceSettings.Directory = this.state.directory;
        config.ComplianceSettings.EnableDaily = this.state.enableDaily;

        return config;
    }

    getStateFromConfig(config) {
        return {
            enable: config.ComplianceSettings.Enable,
            directory: config.ComplianceSettings.Directory,
            enableDaily: config.ComplianceSettings.EnableDaily
        };
    }

    renderTitle() {
        return (
            <FormattedMessage
                id='admin.compliance.title'
                defaultMessage='Compliance Settings'
            />
        );
    }

    renderSettings() {
        const licenseEnabled = global.window.mm_license.IsLicensed === 'true' && global.window.mm_license.Compliance === 'true';

        let bannerContent;
        if (!licenseEnabled) {
            bannerContent = (
                <div className='banner warning'>
                    <div className='banner__content'>
                        <FormattedHTMLMessage
                            id='admin.compliance.noLicense'
                            defaultMessage='<h4 class="banner__heading">Note:</h4><p>Message Export is an enterprise feature. Your current license does not support it. Click <a href="http://mattermost.com"target="_blank">here</a> for information and pricing on enterprise licenses.</p>'
                        />
                    </div>
                </div>
            );
        }

        return (
            <SettingsGroup>
                {bannerContent}
                <BooleanSetting
                    id='enable'
                    label={
                        <FormattedMessage
                            id='admin.compliance.enableTitle'
                            defaultMessage='Enable Message Export:'
                        />
                    }
                    helpText={
                        <FormattedHTMLMessage
                            id='admin.compliance.enableDesc'
                            defaultMessage='When true, Mattermost allows message exporting to a CSV file from <strong>Compliance and Auditing</strong>. See <a href="https://about.mattermost.com/default-message-export-documentation" target="_blank">documentation</a> to learn more.'
                        />
                    }
                    value={this.state.enable}
                    onChange={this.handleChange}
                    disabled={!licenseEnabled}
                />
                <TextSetting
                    id='directory'
                    label={
                        <FormattedMessage
                            id='admin.compliance.directoryTitle'
                            defaultMessage='Export Directory:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.sql.maxOpenExample', 'Ex "10"')}
                    helpText={
                        <FormattedMessage
                            id='admin.compliance.directoryDescription'
                            defaultMessage='Directory to which exports are written to. If blank, will be set to ./data/.'
                        />
                    }
                    value={this.state.directory}
                    onChange={this.handleChange}
                    disabled={!licenseEnabled || !this.state.enable}
                />
                <BooleanSetting
                    id='enableDaily'
                    label={
                        <FormattedMessage
                            id='admin.compliance.enableDailyTitle'
                            defaultMessage='Enable Daily Export:'
                        />
                    }
                    helpText={
                        <FormattedMessage
                            id='admin.compliance.enableDailyDesc'
                            defaultMessage='When true, Mattermost generates a daily message export to <strong>Compliance and Auditing</strong>.'
                        />
                    }
                    value={this.state.enableDaily}
                    onChange={this.handleChange}
                    disabled={!licenseEnabled || !this.state.enable}
                />
            </SettingsGroup>
        );
    }
}
