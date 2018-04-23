// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/channels';
import {addUserToTeam} from 'actions/teams';
import {getProfilesByIds, login} from 'actions/users';
import {createIncomingHook, createOutgoingHook} from 'actions/integrations';
import {Client4} from 'client';
import {General, RequestStatus, Preferences} from 'constants';
import {getPreferenceKey} from 'utils/preference_utils';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

const OK_RESPONSE = {status: 'OK'};

describe('Actions.Channels', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    after(async () => {
        await TestHelper.tearDown();
    });

    it('selectChannel', async () => {
        const channelId = TestHelper.generateId();

        await Actions.selectChannel(channelId)(store.dispatch, store.getState);
        await TestHelper.wait(100);
        const state = store.getState();

        assert.equal(state.entities.channels.currentChannelId, channelId);
    });

    it('createChannel', async () => {
        nock(Client4.getChannelsRoute()).
            post('').
            reply(201, TestHelper.fakeChannelWithId(TestHelper.basicTeam.id));

        await Actions.createChannel(TestHelper.fakeChannel(TestHelper.basicTeam.id), TestHelper.basicUser.id)(store.dispatch, store.getState);

        const createRequest = store.getState().requests.channels.createChannel;
        const membersRequest = store.getState().requests.channels.myMembers;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        } else if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        const channelsCount = Object.keys(channels).length;
        const membersCount = Object.keys(myMembers).length;
        assert.ok(channels);
        assert.ok(myMembers);
        assert.ok(channels[Object.keys(myMembers)[0]]);
        assert.ok(myMembers[Object.keys(channels)[0]]);
        assert.equal(myMembers[Object.keys(channels)[0]].user_id, TestHelper.basicUser.id);
        assert.equal(channelsCount, membersCount);
        assert.equal(channelsCount, 1);
        assert.equal(membersCount, 1);
    });

    it('createDirectChannel', async () => {
        nock(Client4.getUsersRoute()).
            post('').
            query(true).
            reply(201, TestHelper.fakeUserWithId());

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        nock(Client4.getUsersRoute()).
            post('/ids').
            reply(200, [user]);

        await getProfilesByIds([user.id])(store.dispatch, store.getState);

        nock(Client4.getChannelsRoute()).
            post('/direct').
            reply(201, {...TestHelper.fakeChannelWithId(), type: 'D'});

        const {data: created} = await Actions.createDirectChannel(TestHelper.basicUser.id, user.id)(store.dispatch, store.getState);

        const createRequest = store.getState().requests.channels.createChannel;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(createRequest.error);
        }

        const state = store.getState();
        const {channels, myMembers} = state.entities.channels;
        const {profiles, profilesInChannel} = state.entities.users;
        const preferences = state.entities.preferences.myPreferences;
        const channelsCount = Object.keys(channels).length;
        const membersCount = Object.keys(myMembers).length;

        assert.ok(channels, 'channels is empty');
        assert.ok(myMembers, 'members is empty');
        assert.ok(profiles[user.id], 'profiles does not have userId');
        assert.ok(Object.keys(preferences).length, 'preferences is empty');
        assert.ok(channels[Object.keys(myMembers)[0]], 'channels should have the member');
        assert.ok(myMembers[Object.keys(channels)[0]], 'members should belong to channel');
        assert.equal(myMembers[Object.keys(channels)[0]].user_id, TestHelper.basicUser.id);
        assert.equal(channelsCount, membersCount);
        assert.equal(channels[Object.keys(channels)[0]].type, 'D');
        assert.equal(channelsCount, 1);
        assert.equal(membersCount, 1);

        assert.ok(profilesInChannel, 'profiles in channel is empty');
        assert.ok(profilesInChannel[created.id], 'profiles in channel is empty for channel');
        assert.equal(profilesInChannel[created.id].size, 2, 'incorrect number of profiles in channel');
        assert.ok(profilesInChannel[created.id].has(TestHelper.basicUser.id), 'creator is not in channel');
        assert.ok(profilesInChannel[created.id].has(user.id), 'user is not in channel');
    });

    it('createGroupChannel', async () => {
        nock(Client4.getUsersRoute()).
            post('').
            query(true).
            reply(201, TestHelper.fakeUserWithId());

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        nock(Client4.getUsersRoute()).
            post('').
            query(true).
            reply(201, TestHelper.fakeUserWithId());

        const user2 = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, TestHelper.basicUser.password)(store.dispatch, store.getState);

        nock(Client4.getUsersRoute()).
            post('/ids').
            reply(200, [user, user2]);

        await getProfilesByIds([user.id, user2.id])(store.dispatch, store.getState);

        nock(Client4.getChannelsRoute()).
            post('/group').
            reply(201, {...TestHelper.fakeChannelWithId(), type: 'G'});

        const result = await Actions.createGroupChannel([TestHelper.basicUser.id, user.id, user2.id])(store.dispatch, store.getState);
        const created = result.data;

        assert.ok(!result.error, 'error was returned');
        assert.ok(created, 'channel was not returned');

        const createRequest = store.getState().requests.channels.createChannel;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(createRequest.error);
        }

        const state = store.getState();
        const {channels, myMembers} = state.entities.channels;
        const preferences = state.entities.preferences.myPreferences;
        const {profilesInChannel} = state.entities.users;

        assert.ok(channels, 'channels is empty');
        assert.ok(channels[created.id], 'channel does not exist');
        assert.ok(myMembers, 'members is empty');
        assert.ok(myMembers[created.id], 'member does not exist');
        assert.ok(Object.keys(preferences).length, 'preferences is empty');

        assert.ok(profilesInChannel, 'profiles in channel is empty');
        assert.ok(profilesInChannel[created.id], 'profiles in channel is empty for channel');
        assert.equal(profilesInChannel[created.id].size, 3, 'incorrect number of profiles in channel');
        assert.ok(profilesInChannel[created.id].has(TestHelper.basicUser.id), 'creator is not in channel');
        assert.ok(profilesInChannel[created.id].has(user.id), 'user is not in channel');
        assert.ok(profilesInChannel[created.id].has(user2.id), 'user2 is not in channel');
    });

    it('updateChannel', async () => {
        const channel = {
            ...TestHelper.basicChannel,
            purpose: 'This is to test redux',
            header: 'MM with Redux',
        };

        nock(Client4.getChannelsRoute()).
            put(`/${channel.id}`).
            reply(200, channel);

        await Actions.updateChannel(channel)(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.channels.updateChannel;
        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        const {channels} = store.getState().entities.channels;
        const channelId = Object.keys(channels)[0];
        assert.ok(channelId);
        assert.ok(channels[channelId]);
        assert.strictEqual(channels[channelId].header, 'MM with Redux');
    });

    it('patchChannel', async () => {
        const channel = {
            header: 'MM with Redux2',
        };

        nock(Client4.getChannelsRoute()).
            put(`/${TestHelper.basicChannel.id}/patch`).
            reply(200, {...TestHelper.basicChannel, ...channel});

        await Actions.patchChannel(TestHelper.basicChannel.id, channel)(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.channels.updateChannel;
        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        const {channels} = store.getState().entities.channels;
        const channelId = Object.keys(channels)[0];
        assert.ok(channelId);
        assert.ok(channels[channelId]);
        assert.strictEqual(channels[channelId].header, 'MM with Redux2');
    });

    it('getChannel', async () => {
        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}`).
            reply(200, TestHelper.basicChannel);

        await Actions.getChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const channelRequest = store.getState().requests.channels.getChannel;
        if (channelRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelRequest.error));
        }

        const {channels} = store.getState().entities.channels;
        assert.ok(channels[TestHelper.basicChannel.id]);
    });

    it('getChannelByNameAndTeamName', async () => {
        nock(Client4.getTeamsRoute()).
            get(`/name/${TestHelper.basicTeam.name}/channels/name/${TestHelper.basicChannel.name}`).
            reply(200, TestHelper.basicChannel);

        await Actions.getChannelByNameAndTeamName(TestHelper.basicTeam.name, TestHelper.basicChannel.name)(store.dispatch, store.getState);

        const channelRequest = store.getState().requests.channels.getChannel;
        if (channelRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelRequest.error));
        }

        const {channels} = store.getState().entities.channels;
        assert.ok(channels[TestHelper.basicChannel.id]);
    });

    it('getChannelAndMyMember', async () => {
        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}`).
            reply(200, TestHelper.basicChannel);

        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}/members/me`).
            reply(200, TestHelper.basicChannelMember);

        await Actions.getChannelAndMyMember(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const channelRequest = store.getState().requests.channels.getChannel;
        if (channelRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        assert.ok(channels[TestHelper.basicChannel.id]);
        assert.ok(myMembers[TestHelper.basicChannel.id]);
    });

    it('fetchMyChannelsAndMembers', async () => {
        nock(Client4.getUsersRoute()).
            post('').
            query(true).
            reply(201, TestHelper.fakeUserWithId());

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        nock(Client4.getChannelsRoute()).
            post('/direct').
            reply(201, {...TestHelper.fakeChannelWithId(), team_id: '', type: 'D'});

        const {data: directChannel} = await Actions.createDirectChannel(TestHelper.basicUser.id, user.id)(store.dispatch, store.getState);

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels`).
            reply(200, [directChannel, TestHelper.basicChannel]);

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels/members`).
            reply(200, [{user_id: TestHelper.basicUser.id, roles: 'channel_user', channel_id: directChannel.id}, TestHelper.basicChannelMember]);

        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        const channelsRequest = store.getState().requests.channels.myChannels;
        const membersRequest = store.getState().requests.channels.myMembers;
        if (channelsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelsRequest.error));
        } else if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {channels, channelsInTeam, myMembers} = store.getState().entities.channels;
        assert.ok(channels);
        assert.ok(myMembers);
        assert.ok(channels[Object.keys(myMembers)[0]]);
        assert.ok(myMembers[Object.keys(channels)[0]]);
        assert.ok(channelsInTeam[''].has(directChannel.id));
        assert.equal(Object.keys(channels).length, Object.keys(myMembers).length);
    });

    it('updateChannelNotifyProps', async () => {
        const notifyProps = {
            mark_unread: 'mention',
            desktop: 'none',
        };

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels`).
            reply(200, [TestHelper.basicChannel]);

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels/members`).
            reply(200, [TestHelper.basicChannelMember]);

        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        nock(Client4.getChannelsRoute()).
            put(`/${TestHelper.basicChannel.id}/members/${TestHelper.basicUser.id}/notify_props`).
            reply(200, OK_RESPONSE);

        await Actions.updateChannelNotifyProps(
            TestHelper.basicUser.id,
            TestHelper.basicChannel.id,
            notifyProps)(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.channels.updateChannelNotifyProps;
        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        const members = store.getState().entities.channels.myMembers;
        const member = members[TestHelper.basicChannel.id];
        assert.ok(member);
        assert.equal(member.notify_props.mark_unread, 'mention');
        assert.equal(member.notify_props.desktop, 'none');
    });

    it('deleteChannel', async () => {
        const secondClient = TestHelper.createClient4();

        nock(Client4.getUsersRoute()).
            post('').
            query(true).
            reply(201, TestHelper.fakeUserWithId());

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        nock(Client4.getUsersRoute()).
            post('/login').
            reply(200, user);
        await secondClient.login(user.email, 'password1');

        nock(Client4.getChannelsRoute()).
            post('').
            reply(201, TestHelper.fakeChannelWithId(TestHelper.basicTeam.id));
        const secondChannel = await secondClient.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id));

        nock(Client4.getChannelsRoute()).
            post(`/${secondChannel.id}/members`).
            reply(201, {user_id: TestHelper.basicUser.id, roles: 'channel_user', channel_id: secondChannel.id});

        await Actions.joinChannel(
            TestHelper.basicUser.id,
            TestHelper.basicTeam.id,
            secondChannel.id
        )(store.dispatch, store.getState);

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels`).
            reply(200, [secondChannel, TestHelper.basicChannel]);

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels/members`).
            reply(200, [{user_id: TestHelper.basicUser.id, roles: 'channel_user', channel_id: secondChannel.id}, TestHelper.basicChannelMember]);

        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        nock(Client4.getIncomingHooksRoute()).
            post('').
            reply(201, {
                id: TestHelper.generateId(),
                create_at: 1507840900004,
                update_at: 1507840900004,
                delete_at: 0,
                user_id: TestHelper.basicUser.id,
                channel_id: secondChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'TestIncomingHook',
                description: 'Some description.',
            });
        const incomingHook = await createIncomingHook({channel_id: secondChannel.id, display_name: 'test', description: 'test'})(store.dispatch, store.getState);

        nock(Client4.getOutgoingHooksRoute()).
            post('').
            reply(201, {
                id: TestHelper.generateId(),
                token: TestHelper.generateId(),
                create_at: 1507841118796,
                update_at: 1507841118796,
                delete_at: 0,
                creator_id: TestHelper.basicUser.id,
                channel_id: secondChannel.id,
                team_id: TestHelper.basicTeam.id,
                trigger_words: ['testword'],
                trigger_when: 0,
                callback_urls: ['http://notarealurl'],
                display_name: 'TestOutgoingHook',
                description: '',
                content_type: 'application/x-www-form-urlencoded',
            });
        const outgoingHook = await createOutgoingHook({channel_id: secondChannel.id, team_id: TestHelper.basicTeam.id, display_name: 'TestOutgoingHook', trigger_words: [TestHelper.generateId()], callback_urls: ['http://notarealurl']})(store.dispatch, store.getState);

        nock(Client4.getChannelsRoute()).
            delete(`/${secondChannel.id}`).
            reply(200, OK_RESPONSE);

        await Actions.deleteChannel(
            secondChannel.id
        )(store.dispatch, store.getState);

        const deleteRequest = store.getState().requests.channels.deleteChannel;
        if (deleteRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(deleteRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        const {incomingHooks, outgoingHooks} = store.getState().entities.integrations;
        assert.ifError(channels[secondChannel.id]);
        assert.ifError(myMembers[secondChannel.id]);
        assert.ifError(incomingHooks[incomingHook.id]);
        assert.ifError(outgoingHooks[outgoingHook.id]);
    });

    it('viewChannel', async () => {
        nock(Client4.getChannelsRoute()).
            post('').
            reply(201, TestHelper.fakeChannelWithId(TestHelper.basicTeam.id));

        const userChannel = await Client4.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id)
        );

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels`).
            reply(200, [userChannel, TestHelper.basicChannel]);

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels/members`).
            reply(200, [{user_id: TestHelper.basicUser.id, roles: 'channel_user', channel_id: userChannel.id}, TestHelper.basicChannelMember]);

        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        const members = store.getState().entities.channels.myMembers;
        const member = members[TestHelper.basicChannel.id];
        const otherMember = members[userChannel.id];
        assert.ok(member);
        assert.ok(otherMember);

        nock(Client4.getChannelsRoute()).
            post('/members/me/view').
            reply(200, OK_RESPONSE);

        await Actions.viewChannel(
            TestHelper.basicChannel.id,
            userChannel.id
        )(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.channels.updateLastViewedAt;
        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }
    });

    it('markChannelAsViewed', async () => {
        nock(Client4.getChannelsRoute()).
            post('').
            reply(201, TestHelper.fakeChannelWithId(TestHelper.basicTeam.id));

        const userChannel = await Client4.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id)
        );

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels`).
            reply(200, [userChannel, TestHelper.basicChannel]);

        nock(Client4.getUsersRoute()).
            get(`/me/teams/${TestHelper.basicTeam.id}/channels/members`).
            reply(200, [{user_id: TestHelper.basicUser.id, roles: 'channel_user', channel_id: userChannel.id}, TestHelper.basicChannelMember]);

        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        const timestamp = Date.now();
        let members = store.getState().entities.channels.myMembers;
        let member = members[TestHelper.basicChannel.id];
        const otherMember = members[userChannel.id];
        assert.ok(member);
        assert.ok(otherMember);

        await TestHelper.wait(50);

        await Actions.markChannelAsViewed(
            TestHelper.basicChannel.id
        )(store.dispatch, store.getState);

        members = store.getState().entities.channels.myMembers;
        member = members[TestHelper.basicChannel.id];
        assert.ok(member.last_viewed_at > timestamp);
    });

    describe('markChannelAsUnread', async () => {
        it('plain message', async () => {
            const teamId = TestHelper.generateId();
            const channelId = TestHelper.generateId();
            const userId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {team_id: teamId, total_msg_count: 10},
                        },
                        myMembers: {
                            [channelId]: {msg_count: 10, mention_count: 0},
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {msg_count: 0, mention_count: 0},
                        },
                    },
                    users: {
                        currentUserId: userId,
                    },
                },
            });

            store.dispatch(Actions.markChannelAsUnread(teamId, channelId, [TestHelper.generateId()]), store.getState);

            const state = store.getState();
            assert.equal(state.entities.channels.channels[channelId].total_msg_count, 11);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, 10);
            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 1);
            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
        });

        it('message mentioning current user', async () => {
            const teamId = TestHelper.generateId();
            const channelId = TestHelper.generateId();
            const userId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {team_id: teamId, total_msg_count: 10},
                        },
                        myMembers: {
                            [channelId]: {msg_count: 10, mention_count: 0},
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {msg_count: 0, mention_count: 0},
                        },
                    },
                    users: {
                        currentUserId: userId,
                    },
                },
            });

            store.dispatch(Actions.markChannelAsUnread(teamId, channelId, [userId]), store.getState);

            const state = store.getState();
            assert.equal(state.entities.channels.channels[channelId].total_msg_count, 11);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, 10);
            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 1);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 1);
            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 1);
        });

        it('plain message with mark_unread="mention"', async () => {
            const teamId = TestHelper.generateId();
            const channelId = TestHelper.generateId();
            const userId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {team_id: teamId, total_msg_count: 10},
                        },
                        myMembers: {
                            [channelId]: {msg_count: 10, mention_count: 0, notify_props: {mark_unread: General.MENTION}},
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {msg_count: 0, mention_count: 0},
                        },
                    },
                    users: {
                        currentUserId: userId,
                    },
                },
            });

            store.dispatch(Actions.markChannelAsUnread(teamId, channelId, [TestHelper.generateId()]), store.getState);

            const state = store.getState();
            assert.equal(state.entities.channels.channels[channelId].total_msg_count, 11);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, 11);
            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
        });

        it('message mentioning current user with mark_unread="mention"', async () => {
            const teamId = TestHelper.generateId();
            const channelId = TestHelper.generateId();
            const userId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {team_id: teamId, total_msg_count: 10},
                        },
                        myMembers: {
                            [channelId]: {msg_count: 10, mention_count: 0, notify_props: {mark_unread: General.MENTION}},
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {msg_count: 0, mention_count: 0},
                        },
                    },
                    users: {
                        currentUserId: userId,
                    },
                },
            });

            store.dispatch(Actions.markChannelAsUnread(teamId, channelId, [userId]), store.getState);

            const state = store.getState();
            assert.equal(state.entities.channels.channels[channelId].total_msg_count, 11);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, 11);
            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 1);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 1);
        });
    });

    describe('markChannelAsRead', async () => {
        it('one read channel', async () => {
            const channelId = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {
                                id: channelId,
                                team_id: teamId,
                                total_msg_count: 10,
                            },
                        },
                        myMembers: {
                            [channelId]: {
                                channel_id: channelId,
                                mention_count: 0,
                                msg_count: 10,
                            },
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 0,
                                msg_count: 0,
                            },
                        },
                    },
                },
            });

            await Actions.markChannelAsRead(channelId)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, state.entities.channels.channels[channelId].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
        });

        it('one unread channel', async () => {
            const channelId = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {
                                id: channelId,
                                team_id: teamId,
                                total_msg_count: 10,
                            },
                        },
                        myMembers: {
                            [channelId]: {
                                channel_id: channelId,
                                mention_count: 2,
                                msg_count: 5,
                            },
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 2,
                                msg_count: 5,
                            },
                        },
                    },
                },
            });

            await Actions.markChannelAsRead(channelId)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, state.entities.channels.channels[channelId].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
        });

        it('one unread DM channel', async () => {
            const channelId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {
                                id: channelId,
                                team_id: '',
                                total_msg_count: 10,
                            },
                        },
                        myMembers: {
                            [channelId]: {
                                channel_id: channelId,
                                mention_count: 2,
                                msg_count: 5,
                            },
                        },
                    },
                    teams: {
                        myMembers: {
                        },
                    },
                },
            });

            await Actions.markChannelAsRead(channelId)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, state.entities.channels.channels[channelId].total_msg_count);
        });

        it('two unread channels, same team, reading one', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId,
                                total_msg_count: 10,
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId,
                                total_msg_count: 12,
                            },
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5,
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9,
                            },
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 6,
                                msg_count: 8,
                            },
                        },
                    },
                },
            });

            await Actions.markChannelAsRead(channelId1)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 4);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, 9);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 4);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 3);
        });

        it('two unread channels, same team, reading both', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId,
                                total_msg_count: 10,
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId,
                                total_msg_count: 12,
                            },
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5,
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9,
                            },
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 6,
                                msg_count: 8,
                            },
                        },
                    },
                },
            });

            await Actions.markChannelAsRead(channelId1, channelId2)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, state.entities.channels.channels[channelId2].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
        });

        it('two unread channels, same team, reading both (opposite order)', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId,
                                total_msg_count: 10,
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId,
                                total_msg_count: 12,
                            },
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5,
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9,
                            },
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 6,
                                msg_count: 8,
                            },
                        },
                    },
                },
            });

            await Actions.markChannelAsRead(channelId2, channelId1)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, state.entities.channels.channels[channelId2].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
        });

        it('two unread channels, different teams, reading one', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId1 = TestHelper.generateId();
            const teamId2 = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId1,
                                total_msg_count: 10,
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId2,
                                total_msg_count: 12,
                            },
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5,
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9,
                            },
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId1]: {
                                id: teamId1,
                                mention_count: 2,
                                msg_count: 5,
                            },
                            [teamId2]: {
                                id: teamId2,
                                mention_count: 4,
                                msg_count: 3,
                            },
                        },
                    },
                },
            });

            await Actions.markChannelAsRead(channelId1)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 4);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, 9);

            assert.equal(state.entities.teams.myMembers[teamId1].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId1].msg_count, 0);

            assert.equal(state.entities.teams.myMembers[teamId2].mention_count, 4);
            assert.equal(state.entities.teams.myMembers[teamId2].msg_count, 3);
        });

        it('two unread channels, different teams, reading both', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId1 = TestHelper.generateId();
            const teamId2 = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId1,
                                total_msg_count: 10,
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId2,
                                total_msg_count: 12,
                            },
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5,
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9,
                            },
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId1]: {
                                id: teamId1,
                                mention_count: 2,
                                msg_count: 5,
                            },
                            [teamId2]: {
                                id: teamId2,
                                mention_count: 4,
                                msg_count: 3,
                            },
                        },
                    },
                },
            });

            await Actions.markChannelAsRead(channelId1, channelId2)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, state.entities.channels.channels[channelId2].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId1].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId1].msg_count, 0);

            assert.equal(state.entities.teams.myMembers[teamId2].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId2].msg_count, 0);
        });

        it('two unread channels, different teams, reading both (opposite order)', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId1 = TestHelper.generateId();
            const teamId2 = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId1,
                                total_msg_count: 10,
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId2,
                                total_msg_count: 12,
                            },
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5,
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9,
                            },
                        },
                    },
                    teams: {
                        myMembers: {
                            [teamId1]: {
                                id: teamId1,
                                mention_count: 2,
                                msg_count: 5,
                            },
                            [teamId2]: {
                                id: teamId2,
                                mention_count: 4,
                                msg_count: 3,
                            },
                        },
                    },
                },
            });

            await Actions.markChannelAsRead(channelId1, channelId2)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, state.entities.channels.channels[channelId2].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId1].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId1].msg_count, 0);

            assert.equal(state.entities.teams.myMembers[teamId2].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId2].msg_count, 0);
        });
    });

    it('getChannels', async () => {
        const userClient = TestHelper.createClient4();

        nock(Client4.getUsersRoute()).
            post('').
            query(true).
            reply(201, TestHelper.fakeUserWithId());

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        nock(Client4.getUsersRoute()).
            post('/login').
            reply(200, user);

        await userClient.login(user.email, 'password1');

        nock(Client4.getChannelsRoute()).
            post('').
            reply(201, TestHelper.fakeChannelWithId(TestHelper.basicTeam.id));

        const userChannel = await userClient.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id)
        );

        nock(Client4.getTeamsRoute()).
            get(`/${TestHelper.basicTeam.id}/channels`).
            query(true).
            reply(200, [TestHelper.basicChannel, userChannel]);

        await Actions.getChannels(TestHelper.basicTeam.id, 0)(store.dispatch, store.getState);

        const moreRequest = store.getState().requests.channels.getChannels;
        if (moreRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(moreRequest.error));
        }

        const {channels, channelsInTeam, myMembers} = store.getState().entities.channels;
        const channel = channels[userChannel.id];
        const team = channelsInTeam[userChannel.team_id];

        assert.ok(channel);
        assert.ok(team);
        assert.ok(team.has(userChannel.id));
        assert.ifError(myMembers[channel.id]);
    });

    it('getChannelMembers', async () => {
        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}/members`).
            query(true).
            reply(200, [TestHelper.basicChannelMember]);

        await Actions.getChannelMembers(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.members;
        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {membersInChannel} = store.getState().entities.channels;

        assert.ok(membersInChannel);
        assert.ok(membersInChannel[TestHelper.basicChannel.id]);
        assert.ok(membersInChannel[TestHelper.basicChannel.id][TestHelper.basicUser.id]);
    });

    it('getChannelMember', async () => {
        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}/members/${TestHelper.basicUser.id}`).
            reply(200, TestHelper.basicChannelMember);

        await Actions.getChannelMember(TestHelper.basicChannel.id, TestHelper.basicUser.id)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.members;
        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {membersInChannel} = store.getState().entities.channels;

        assert.ok(membersInChannel);
        assert.ok(membersInChannel[TestHelper.basicChannel.id]);
        assert.ok(membersInChannel[TestHelper.basicChannel.id][TestHelper.basicUser.id]);
    });

    it('getMyChannelMember', async () => {
        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}/members/me`).
            reply(200, TestHelper.basicChannelMember);

        await Actions.getMyChannelMember(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.members;
        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {myMembers} = store.getState().entities.channels;

        assert.ok(myMembers);
        assert.ok(myMembers[TestHelper.basicChannel.id]);
    });

    it('getChannelMembersByIds', async () => {
        nock(Client4.getChannelsRoute()).
            post(`/${TestHelper.basicChannel.id}/members/ids`).
            reply(200, [TestHelper.basicChannelMember]);

        await Actions.getChannelMembersByIds(TestHelper.basicChannel.id, [TestHelper.basicUser.id])(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.members;
        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {membersInChannel} = store.getState().entities.channels;

        assert.ok(membersInChannel);
        assert.ok(membersInChannel[TestHelper.basicChannel.id]);
        assert.ok(membersInChannel[TestHelper.basicChannel.id][TestHelper.basicUser.id]);
    });

    it('getChannelStats', async () => {
        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}/stats`).
            reply(200, {channel_id: TestHelper.basicChannel.id, member_count: 1});

        await Actions.getChannelStats(
            TestHelper.basicChannel.id
        )(store.dispatch, store.getState);

        const statsRequest = store.getState().requests.channels.getChannelStats;
        if (statsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(statsRequest.error));
        }

        const {stats} = store.getState().entities.channels;
        const stat = stats[TestHelper.basicChannel.id];
        assert.ok(stat);
        assert.ok(stat.member_count >= 1);
    });

    it('addChannelMember', async () => {
        const channelId = TestHelper.basicChannel.id;

        nock(Client4.getUsersRoute()).
            post('').
            query(true).
            reply(201, TestHelper.fakeUserWithId());

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        nock(Client4.getChannelsRoute()).
            post(`/${TestHelper.basicChannel.id}/members`).
            reply(201, {channel_id: TestHelper.basicChannel.id, roles: 'channel_user', user_id: TestHelper.basicUser.id});

        await Actions.joinChannel(
            TestHelper.basicUser.id,
            TestHelper.basicTeam.id,
            channelId
        )(store.dispatch, store.getState);

        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}/stats`).
            reply(200, {channel_id: TestHelper.basicChannel.id, member_count: 1});

        await Actions.getChannelStats(
            channelId
        )(store.dispatch, store.getState);

        let state = store.getState();
        let {stats} = state.entities.channels;
        assert.ok(stats, 'stats');
        assert.ok(stats[channelId], 'stats for channel');
        assert.ok(stats[channelId].member_count, 'member count for channel');
        assert.ok(stats[channelId].member_count >= 1, 'incorrect member count for channel');

        nock(Client4.getChannelsRoute()).
            post(`/${TestHelper.basicChannel.id}/members`).
            reply(201, {channel_id: TestHelper.basicChannel.id, roles: 'channel_user', user_id: user.id});

        await Actions.addChannelMember(
            channelId,
            user.id
        )(store.dispatch, store.getState);

        state = store.getState();

        const addRequest = state.requests.channels.addChannelMember;
        if (addRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(addRequest.error));
        }

        const {profilesInChannel, profilesNotInChannel} = state.entities.users;
        const channel = profilesInChannel[channelId];
        const notChannel = profilesNotInChannel[channelId];
        assert.ok(channel);
        assert.ok(notChannel);
        assert.ok(channel.has(user.id));
        assert.ifError(notChannel.has(user.id));

        stats = state.entities.channels.stats;
        assert.ok(stats, 'stats');
        assert.ok(stats[channelId], 'stats for channel');
        assert.ok(stats[channelId].member_count, 'member count for channel');
        assert.ok(stats[channelId].member_count >= 2, 'incorrect member count for channel');
    });

    it('removeChannelMember', async () => {
        const channelId = TestHelper.basicChannel.id;

        nock(Client4.getUsersRoute()).
            post('').
            query(true).
            reply(201, TestHelper.fakeUserWithId());

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        nock(Client4.getChannelsRoute()).
            post(`/${TestHelper.basicChannel.id}/members`).
            reply(201, {channel_id: TestHelper.basicChannel.id, roles: 'channel_user', user_id: TestHelper.basicUser.id});

        await Actions.joinChannel(
            TestHelper.basicUser.id,
            TestHelper.basicTeam.id,
            channelId
        )(store.dispatch, store.getState);

        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}/stats`).
            reply(200, {channel_id: TestHelper.basicChannel.id, member_count: 1});

        await Actions.getChannelStats(
            channelId
        )(store.dispatch, store.getState);

        nock(Client4.getChannelsRoute()).
            post(`/${TestHelper.basicChannel.id}/members`).
            reply(201, {channel_id: TestHelper.basicChannel.id, roles: 'channel_user', user_id: user.id});

        await Actions.addChannelMember(
            channelId,
            user.id
        )(store.dispatch, store.getState);

        let state = store.getState();
        let {stats} = state.entities.channels;
        assert.ok(stats, 'stats');
        assert.ok(stats[channelId], 'stats for channel');
        assert.ok(stats[channelId].member_count, 'member count for channel');
        assert.ok(stats[channelId].member_count >= 2, 'incorrect member count for channel');

        nock(Client4.getChannelsRoute()).
            delete(`/${TestHelper.basicChannel.id}/members/${user.id}`).
            reply(200, OK_RESPONSE);

        await Actions.removeChannelMember(
            channelId,
            user.id
        )(store.dispatch, store.getState);

        state = store.getState();

        const removeRequest = state.requests.channels.removeChannelMember;
        if (removeRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(removeRequest.error));
        }

        const {profilesInChannel, profilesNotInChannel} = state.entities.users;
        const channel = profilesInChannel[channelId];
        const notChannel = profilesNotInChannel[channelId];
        assert.ok(channel);
        assert.ok(notChannel);
        assert.ok(notChannel.has(user.id));
        assert.ifError(channel.has(user.id));

        stats = state.entities.channels.stats;
        assert.ok(stats, 'stats');
        assert.ok(stats[channelId], 'stats for channel');
        assert.ok(stats[channelId].member_count, 'member count for channel');
        assert.ok(stats[channelId].member_count >= 1, 'incorrect member count for channel');
    });

    it('updateChannelMemberRoles', async () => {
        nock(Client4.getUsersRoute()).
            post('').
            reply(201, TestHelper.fakeUserWithId());

        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());

        nock(Client4.getTeamsRoute()).
            post(`/${TestHelper.basicChannel.id}/members`).
            reply(201, {team_id: TestHelper.basicTeam.id, roles: 'channel_user', user_id: user.id});

        await addUserToTeam(TestHelper.basicTeam.id, user.id)(store.dispatch, store.getState);
        nock(Client4.getChannelsRoute()).
            post(`/${TestHelper.basicChannel.id}/members`).
            reply(201, {channel_id: TestHelper.basicChannel.id, roles: 'channel_user', user_id: user.id});

        await Actions.addChannelMember(TestHelper.basicChannel.id, user.id)(store.dispatch, store.getState);

        const roles = General.CHANNEL_USER_ROLE + ' ' + General.CHANNEL_ADMIN_ROLE;

        nock(Client4.getChannelsRoute()).
            put(`/${TestHelper.basicChannel.id}/members/${user.id}/roles`).
            reply(200, {roles});
        await Actions.updateChannelMemberRoles(TestHelper.basicChannel.id, user.id, roles)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.updateChannelMember;
        const members = store.getState().entities.channels.membersInChannel;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        assert.ok(members[TestHelper.basicChannel.id]);
        assert.ok(members[TestHelper.basicChannel.id][user.id]);
        assert.ok(members[TestHelper.basicChannel.id][user.id].roles === roles);
    });

    it('updateChannelHeader', async () => {
        nock(Client4.getChannelsRoute()).
            post(`${TestHelper.basicChannel.id}`).
            reply(200, TestHelper.basicChannel);

        await Actions.getChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const channelRequest = store.getState().requests.channels.getChannel;
        if (channelRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelRequest.error));
        }

        const header = 'this is an updated test header';

        await Actions.updateChannelHeader(
            TestHelper.basicChannel.id,
            header
        )(store.dispatch, store.getState);

        const {channels} = store.getState().entities.channels;
        const channel = channels[TestHelper.basicChannel.id];
        assert.ok(channel);
        assert.deepEqual(channel.header, header);
    });

    it('updateChannelPurpose', async () => {
        nock(Client4.getChannelsRoute()).
            post(`${TestHelper.basicChannel.id}`).
            reply(200, TestHelper.basicChannel);

        await Actions.getChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const channelRequest = store.getState().requests.channels.getChannel;
        if (channelRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelRequest.error));
        }

        const purpose = 'this is an updated test purpose';
        await Actions.updateChannelPurpose(
            TestHelper.basicChannel.id,
            purpose
        )(store.dispatch, store.getState);
        const {channels} = store.getState().entities.channels;
        const channel = channels[TestHelper.basicChannel.id];
        assert.ok(channel);
        assert.deepEqual(channel.purpose, purpose);
    });

    it('leaveChannel', (done) => {
        if (TestHelper.isLiveServer()) {
            console.log('Skipping mock-only test');
            done();
            return;
        }

        async function test() {
            TestHelper.mockLogin();
            await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);
            nock(Client4.getChannelsRoute()).
                get(`/${TestHelper.basicChannel.id}`).
                reply(200, TestHelper.basicChannel);

            nock(Client4.getChannelsRoute()).
                post(`/${TestHelper.basicChannel.id}/members`).
                reply(201, {channel_id: TestHelper.basicChannel.id, roles: 'channel_user', user_id: TestHelper.basicUser.id});

            await Actions.joinChannel(
                TestHelper.basicUser.id,
                TestHelper.basicTeam.id,
                TestHelper.basicChannel.id
            )(store.dispatch, store.getState);

            const {channels, myMembers} = store.getState().entities.channels;
            assert.ok(channels[TestHelper.basicChannel.id]);
            assert.ok(myMembers[TestHelper.basicChannel.id]);

            nock(Client4.getChannelMemberRoute(TestHelper.basicChannel.id, TestHelper.basicUser.id)).
                delete('').
                reply(400, {});

            nock(Client4.getChannelMemberRoute(TestHelper.basicChannel.id, TestHelper.basicUser.id)).
                delete('').
                reply(200, OK_RESPONSE);

            // This action will retry after 1000ms
            await Actions.leaveChannel(
                TestHelper.basicChannel.id
            )(store.dispatch, store.getState);

            setTimeout(test2, 300);
        }

        async function test2() {
            // retry will have completed and should have left the channel successfully
            const {channels, myMembers} = store.getState().entities.channels;

            assert.ok(channels[TestHelper.basicChannel.id]);
            assert.ifError(myMembers[TestHelper.basicChannel.id]);
            done();
        }

        test();
    });

    it('leave private channel', async () => {
        const newChannel = {
            team_id: TestHelper.basicTeam.id,
            name: 'redux-test-private',
            display_name: 'Redux Test',
            purpose: 'This is to test redux',
            header: 'MM with Redux',
            type: 'P',
        };

        nock(Client4.getChannelsRoute()).
            post('').
            reply(201, {...TestHelper.fakeChannelWithId(TestHelper.basicTeam.id), ...newChannel});

        const {data: channel} = await Actions.createChannel(newChannel, TestHelper.basicUser.id)(store.dispatch, store.getState);
        let channels = store.getState().entities.channels.channels;
        assert.ok(channels[channel.id]);

        nock(Client4.getChannelsRoute()).
            delete(`/${TestHelper.basicChannel.id}/members/${TestHelper.basicUser.id}`).
            reply(200, OK_RESPONSE);

        await Actions.leaveChannel(
            channel.id
        )(store.dispatch, store.getState);
        channels = store.getState().entities.channels.channels;
        const myMembers = store.getState().entities.channels.myMembers;
        assert.ok(!channels[channel.id]);
        assert.ok(!myMembers[channel.id]);
    });

    it('joinChannel', async () => {
        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}`).
            reply(200, TestHelper.basicChannel);

        nock(Client4.getChannelsRoute()).
            post(`/${TestHelper.basicChannel.id}/members`).
            reply(201, {channel_id: TestHelper.basicChannel.id, roles: 'channel_user', user_id: TestHelper.basicUser.id});

        await Actions.joinChannel(
            TestHelper.basicUser.id,
            TestHelper.basicTeam.id,
            TestHelper.basicChannel.id
        )(store.dispatch, store.getState);

        const joinRequest = store.getState().requests.channels.joinChannel;
        if (joinRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(joinRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        assert.ok(channels[TestHelper.basicChannel.id]);
        assert.ok(myMembers[TestHelper.basicChannel.id]);
    });

    it('joinChannelByName', async () => {
        const secondClient = TestHelper.createClient4();

        nock(Client4.getUsersRoute()).
            post('').
            query(true).
            reply(201, TestHelper.fakeUserWithId());

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        nock(Client4.getUsersRoute()).
            post('/login').
            reply(200, user);

        await secondClient.login(user.email, 'password1');

        nock(Client4.getChannelsRoute()).
            post('').
            reply(201, TestHelper.fakeChannelWithId(TestHelper.basicTeam.id));

        const secondChannel = await secondClient.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id));

        nock(Client4.getTeamsRoute()).
            get(`/${TestHelper.basicTeam.id}/channels/name/${secondChannel.name}`).
            reply(200, secondChannel);

        nock(Client4.getChannelsRoute()).
            post(`/${secondChannel.id}/members`).
            reply(201, {channel_id: secondChannel.id, roles: 'channel_user', user_id: TestHelper.basicUser.id});

        await Actions.joinChannel(
            TestHelper.basicUser.id,
            TestHelper.basicTeam.id,
            null,
            secondChannel.name
        )(store.dispatch, store.getState);

        const joinRequest = store.getState().requests.channels.joinChannel;
        if (joinRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(joinRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        assert.ok(channels[secondChannel.id]);
        assert.ok(myMembers[secondChannel.id]);
    });

    it('favoriteChannel', async () => {
        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);

        await Actions.favoriteChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const state = store.getState();
        const prefKey = getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, TestHelper.basicChannel.id);
        const preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);
        assert.ok(preference.value === 'true');
    });

    it('unfavoriteChannel', async () => {
        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);

        await Actions.favoriteChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        let state = store.getState();
        let prefKey = getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, TestHelper.basicChannel.id);
        let preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);
        assert.ok(preference.value === 'true');

        nock(Client4.getUsersRoute()).
            delete(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        Actions.unfavoriteChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        state = store.getState();
        prefKey = getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, TestHelper.basicChannel.id);
        preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(!preference);
    });

    it('autocompleteChannels', async () => {
        const prefix = TestHelper.basicChannel.name.slice(0, 5);

        nock(Client4.getTeamRoute(TestHelper.basicChannel.team_id)).
            get('/channels/autocomplete').
            query({name: prefix}).
            reply(200, [TestHelper.basicChannel]);

        const result = await Actions.autocompleteChannels(
            TestHelper.basicChannel.team_id,
            prefix
        )(store.dispatch, store.getState);

        assert.deepEqual(result, {data: [TestHelper.basicChannel]});
    });
});
