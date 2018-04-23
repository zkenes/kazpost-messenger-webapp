// @flow

export type UserProfile = {
    id: string,
    create_at: number,
    update_at: number,
    delete_at: number,
    username: string,
    auth_data: string,
    auth_service: string,
    email: string,
    email_verified: boolean,
    nickname: string,
    first_name: string,
    last_name: string,
    position: string,
    roles: string,
};

export type UsersState = {
    currentUserId: string,
    mySessions: Array<Object>,
    myAudits: Array<Object>,
    profiles: {[string]: UserProfile},
    profilesInTeam: Object,
    profilesNotInTeam: Object,
    profilesWithoutTeam: Set<Object>,
    profilesInChannel: {[string]: Array<string>},
    profilesNotInChannel: {[string]: Array<string>},
    statuses: {[string]: string}
};
