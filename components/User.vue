<template>
    <div class="container user-containter"> 
        <router-link :to="{ name: 'home'}" tag="button" class="btn btn-primary">Назад</router-link>
        <div class="card">
          <h5 class="card-header">
            Друзья
          </h5>
          <div class="card-body">
            <div class="row">
                <div class=" col-sm-3" v-for="friend in friends" :key="friend.id">
                    <span>
                        <img :src="friend.photo">
                    </span>
                    <p class="text-center">{{ friend.name }}</p>
                </div>
            </div>
          </div>
        </div>

        <div class="card" v-for="item in items" :key="item.date">
          <div class="card-body">
            <div class="row">
                <div class="col-sm-2 w-12">
                    <img class="avatar" :src="item.from.photo" />
                </div>
                <div class="col-sm-10">
                    <h5 class="card-title">{{ item.from.name }}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">{{ moment(item.from.date).format('LLL') }}</h6>
                </div>
            </div>
            <div class="card-body-info" :class="{'card-copy-info' : item.copyInfo.name}">
                <div class="row" v-if="item.copyInfo.name">
                    <div class="col-sm-2 w-12">
                        <img class="avatar" :src="item.copyInfo.photo" />
                    </div>
                    <div class="col-sm-10">
                        <h5 class="card-title">{{ item.copyInfo.name }}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">{{ moment(item.copyInfo.date).format('LLL') }}</h6>
                    </div>
                </div>
                <p class="card-text">
                    <TextHide class="mb-3" :text="item.text" />
                    <div class="row">
                        <div
                            :class="{'col-sm-3' : item.files.length > 1, 'col-sm-12' : item.files.length === 1}"
                            v-for="file in item.files">
                            <img :src="file.url" v-if="file.type === 'photo'" />
                            <img :src="file.url" v-if="file.type === 'doc'" />
                        </div>
                        <div class="col-sm-12" v-for="file in item.linkFiles">
                            <LinkPost :link="file" />
                        </div>
                    </div>
                </p>
            </div>    
          </div>
        </div>

    </div>
</template>
 
<script>
    import { mapGetters, mapActions } from 'vuex'
    import moment from 'moment'
    import TextHide from './TextHide.vue'
    import LinkPost from './LinkPost.vue'
    moment.locale('ru');

    export default {
        name: "User",
        data: function () {
            return {
                friends: [],
                items: []
            }
        },
        components: {
            TextHide,
            LinkPost
        },
        created() {
            this.getFriendsApp();
            this.moment = moment;
            this.getMessages();
        },
        computed: {
            ...mapGetters(['users'])
        },
        methods: {
            ...mapActions(['getFriends', 'getWall']),
            getFriendsApp() {
                const users = [];

                this.getFriends(parseInt(this.$route.params.id)).then(data => {
                    const friends = data.map(v => v.id);

                    for (let val of this.users) {
                        if (friends.includes(val.id)) {
                            users.push({
                                ...val,
                                name: val.name.split(' ')[0]
                            });
                        }
                        
                    }
                    this.friends = users;
                });
            },
            getMessages() {
                this.getWall(parseInt(this.$route.params.id)).then(data => {
                    const items = data.items.map(v => {
                        return this.getPost(v, data.profiles, data.groups);
                    });
                    this.items = items;
                });
            },
            getPost(data, profiles, groups) {
                let files = [];
                let copyInfo = {};
                let value;
                let item;
                let date;
                const profile = profiles.filter(v => v.id === data.from_id)[0];

                if (data.copy_history !== undefined) {
                    value = data.copy_history[0];

                    if (value.from_id < 0) {
                        item = groups.filter(g => g.id === Math.abs(value.from_id))[0];
                        date = value.date * 1000;
                    } else {
                        item = profiles.filter(v => v.id === value.from_id)[0];
                        date = this.getDateForProfile(value) * 1000;
                    }
                    

                    copyInfo = {
                        name: item.name !== undefined ? item.name : `${item.first_name} ${item.last_name}`,
                        photo: item.photo_100,
                        date
                    };
                } else {
                    value = data;
                }

                if (value.attachments !== undefined) {
                    for (let file of value.attachments) {
                        files.push(this.getFile(file))
                    }
                }

                return {
                    copyInfo: {
                        ...copyInfo
                    }, 
                    from: {
                        name: `${profile.first_name} ${profile.last_name}`,
                        photo: profile.photo_100,
                        date: data.date * 1000
                    },
                    text: value.text,
                    files: files.filter(v => v.type !== 'link'),
                    linkFiles: files.filter(v => v.type === 'link') 
                }

                
            },
            getFile(file) {
                switch(file.type) {
                    case 'photo':
                        return this.getPhotoPost(file.photo);
                    case 'link':
                        return this.getLinkPost(file.link);
                    case 'doc':
                        return this.getDocPost(file.doc);    
                    default:
                        return {};    
                }
            },
            getPhotoPost(value) {
                return {
                    url: value.sizes.filter(s => s.type === 'y').length 
                            ? value.sizes.filter(s => s.type === 'y')[0].url
                            : value.sizes.filter(s => s.type === 'p').length ? value.sizes.filter(s => s.type === 'p')[0].url
                            : value.sizes[0].url,
                    type: 'photo'
                }
            },
            getLinkPost(value) {
                return {
                    title: value.title === '' ? value.url : value.title,
                    url: value.url,
                    description: value.description,
                    photo: value.photo !== undefined ? this.getPhotoPost(value.photo) : '',
                    type: 'link'
                }
            },
            getDocPost(value) {
                return {
                    url: value.url,
                    type: 'doc'
                }
            },
            getDateForProfile(value) {
                if (value.attachments === undefined) {
                    return value.date
                };
                
                for (let item of value.attachments) {
                    for (let val in item) {
                        if (item[val].date) {
                            return item[val].date;
                        }
                        
                    }
                }
            }
        }
    }
</script>
 