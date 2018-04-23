// @flow

import type {GeneralState} from './general';
import type {UsersState} from './users';
import type {TeamsState} from './teams';
import type {ChannelsState} from './channels';
import type {PostsState} from './posts';
import type {AdminState} from './admin';
import type {JobsState} from './jobs';
import type {SearchState} from './search';
import type {IntegrationsState} from './integrations';
import type {FilesState} from './files';
import type {EmojisState} from './emojis';
import type {ChannelsRequestsStatuses,
             GeneralRequestsStatuses,
             PostsRequestsStatuses,
             TeamsRequestsStatuses,
             UsersRequestsStatuses,
             PreferencesRequestsStatuses,
             AdminRequestsStatuses,
             EmojisRequestsStatuses,
             FilesRequestsStatuses,
             IntegrationsRequestsStatuses,
} from './requests';

export type GlobalState = {
    entities: {
        general: GeneralState,
        users: UsersState,
        teams: TeamsState,
        channels: ChannelsState,
        posts: PostsState,
        preferences: {
            myPreferences: Object
        },
        admin: AdminState,
        jobs: JobsState,
        alerts: {
            alertStack: Array<Object>
        },
        search: SearchState,
        integrations: IntegrationsState,
        files: FilesState,
        emojis: EmojisState,
        typing: Object
    },
    errors: Array<Object>,
    requests: {
        channels: ChannelsRequestsStatuses,
        general: GeneralRequestsStatuses,
        posts: PostsRequestsStatuses,
        teams: TeamsRequestsStatuses,
        users: UsersRequestsStatuses,
        preferences: PreferencesRequestsStatuses,
        admin: AdminRequestsStatuses,
        emojis: EmojisRequestsStatuses,
        files: FilesRequestsStatuses,
        integrations: IntegrationsRequestsStatuses
    }
};
