import config from '/config'
import { jsonp } from 'vue-jsonp'

function getQueryParams(params) {
	let query = '';
	for (let key in params) {
		query = query === '' ? `${key}=${params[key]}` : `${query}&${key}=${params[key]}`;
	}
	return query;
}

function getUrl(method, params) {
	params = params || {};
	params['access_token'] = config.KEY;
	params['v'] = config.VERSION;
	return `https://api.vk.com/method/${method}?${getQueryParams(params)}`;
}

export default {
	actions: {
		async getFriends(ctx, id = 97861072) {
			const params = {
				user_id: id,
				fields: 'nickname,photo_200_orig'
			};

			const users = await jsonp(getUrl('friends.get', params)).then(data => {
				try {
					return data.response.items.map(v => {
						return {
							id: v.id,
							name: `${v.first_name} ${v.last_name}`,
							photo: v.photo_200_orig
						}
					});
				} catch {
					return [{
						id: -1
					}];
				}
			});

			return users;
		},
		async getUsers(ctx, q) {
			const params = {
				q,
				fields: 'photo_200_orig'
			};
			const isString = Number.isNaN(parseInt(q));

			if (isString) {
				return await jsonp(getUrl('users.search', params)).then(data => {
					return data.response;
				});
			}

			const result = await this.dispatch('getUserInfo', parseInt(q));

			return {
				items: [result]
			}
		},
		async getUserInfo(ctx, id) {
			const params = {
				user_id: id,
				fields: 'sex,counters,bdate,photo_200_orig'
			};

			return await jsonp(getUrl('users.get', params)).then(data => {
				try {
					return data.response[0];
				} catch {
					return {
						id: -1
					};
				}
			});
		},
		async getWall(ctx, id) {
			const params = {
				owner_id: id,
				extended: 1
			}

			return await jsonp(getUrl('wall.get', params)).then(data => {
				return data.response;
			})
		}
	},
	mutations: {
		updateUsers(state, users) {
			state.users = users;
		},
		updateFriends(state, friends) {
			state.friends = friends;
		}
	},
	state: {
		users: [],
		friends: []
	},
	getters: {
		users(state) {
			return state.users;
		},
		friends(state) {
			return state.friends;
		}
	}
}