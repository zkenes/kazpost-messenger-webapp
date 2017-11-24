import React from 'react';
import {FormattedHTMLMessage, FormattedMessage} from 'react-intl';

import {JobTypes} from 'utils/constants.jsx';
import * as Utils from 'utils/utils.jsx';

import AdminSettings from './admin_settings.jsx';
import BooleanSetting from './boolean_setting.jsx';
import DropdownSetting from './dropdown_setting.jsx';
import JobsTable from './jobs';
import SettingsGroup from './settings_group.jsx';
import TextSetting from './text_setting.jsx';

export default class MessageExportSettings extends AdminSettings {
    constructor(props) {
        super(props);

        this.getConfigFromState = this.getConfigFromState.bind(this);
        this.renderSettings = this.renderSettings.bind(this);
    }

    getConfigFromState(config) {
        config.MessageExportSettings.EnableExport = this.state.enableMessageExport;
        config.MessageExportSettings.DailyRunTime = this.state.exportJobStartTime;
        config.MessageExportSettings.ExportFromTimestamp = parseInt(this.state.exportFromTimestamp, 10);
        config.MessageExportSettings.FileLocation = this.state.exportLocation;
        return config;
    }

    getStateFromConfig(config) {
        return {
            enableMessageExport: config.MessageExportSettings.EnableExport,
            exportJobStartTime: config.MessageExportSettings.DailyRunTime,
            exportFromTimestamp: String(config.MessageExportSettings.ExportFromTimestamp),
            exportLocation: config.MessageExportSettings.FileLocation
        };
    }

    renderTitle() {
        return (
            <FormattedMessage
                id='admin.messageExport.title'
                defaultMessage='Compliance Export (Beta)'
            />
        );
    }

    renderSettings() {
        const exportFormatOptions = [
            {value: 'actiance', text: Utils.localizeMessage('admin.messageExport.exportFormat.actiance', 'Actiance XML')}
        ];

        return (
            <SettingsGroup>
                <div className='banner'>
                    <div className='banner__content'>
                        <FormattedHTMLMessage
                            id='admin.messageExport.description'
                            defaultMessage='Changing properties in this section will require a server restart before taking effect.'
                        />
                    </div>
                </div>

                <BooleanSetting
                    id='enableMessageExport'
                    label={
                        <FormattedMessage
                            id='admin.service.messageExportTitle'
                            defaultMessage='Enable Compliance Export:'
                        />
                    }
                    helpText={
                        <FormattedMessage
                            id='admin.service.messageExportDesc'
                            defaultMessage='When true, Mattermost generates a compliance export file containing messages posted in the past day. The export task is scheduled to run once per day. See <a href="https://about.mattermost.com/default-compliance-export-documentation" target="_blank">documentation</a> to learn more.'
                        />
                    }
                    value={this.state.enableMessageExport}
                    onChange={this.handleChange}
                />

                <TextSetting
                    id='exportJobStartTime'
                    label={
                        <FormattedMessage
                            id='admin.messageExport.exportJobStartTime.title'
                            defaultMessage='Compliance Export Time:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.messageExport.exportJobStartTime.example', 'E.g.: "02:00"')}
                    helpText={
                        <FormattedMessage
                            id='admin.messageExport.exportJobStartTime.description'
                            defaultMessage='Set the start time of the daily scheduled message export job. Choose a time when fewer people are using your system. Must be a 24-hour time stamp in the form HH:MM.'
                        />
                    }
                    value={this.state.exportJobStartTime}
                    disabled={!this.state.enableMessageExport}
                    onChange={this.handleChange}
                />

                {/* dropdown value is hard-coded until we support more than one export format */}
                <DropdownSetting
                    id='exportFormat'
                    values={exportFormatOptions}
                    label={
                        <FormattedMessage
                            id='admin.messageExport.exportFormat.title'
                            defaultMessage='Export File Format:'
                        />
                    }
                    helpText={
                        <FormattedMessage
                            id='admin.messageExport.exportFormat.description'
                            defaultMessage='File format of the compliance export.'
                        />
                    }
                    value='actiance'
                    disabled={!this.state.enableMessageExport}
                    onChange={this.handleChange}
                />

                <TextSetting
                    id='exportLocation'
                    label={
                        <FormattedMessage
                            id='admin.messageExport.exportLocation.title'
                            defaultMessage='Export Directory:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.messageExport.exportLocation.example', 'E.g.: /var/mattermost/exports/')}
                    helpText={
                        <FormattedMessage
                            id='admin.messageExport.exportLocation.description'
                            defaultMessage='Directory to which compliance exports are written to. Mattermost must have write permissions to the directory, and the path that you set should not include a filename.'
                        />
                    }
                    value={this.state.exportLocation}
                    disabled={!this.state.enableMessageExport}
                    onChange={this.handleChange}
                />

                <JobsTable
                    jobType={JobTypes.MESSAGE_EXPORT}
                    disabled={!this.state.enableMessageExport}
                    createJobButtonText={
                        <FormattedMessage
                            id='admin.messageExport.createJob.title'
                            defaultMessage='Run Compliance Export Job Now'
                        />
                    }
                    createJobHelpText={
                        <FormattedMessage
                            id='admin.messageExport.createJob.help'
                            defaultMessage='Initiates a compliance export job immediately.'
                        />
                    }
                />
            </SettingsGroup>
        );
    }
}
