<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-4">
                <div class="dropdown">
                    <input
                        type="text"
                        name="name"
                        v-model="filter"
                        @focus="show = true"
                        @keyup="search()"
                        class="form-control"
                    >
                    <ul class="dropdown-menu" :class="{'show': show && users.length > 0}">
                        <li v-for="user in users" :key="user.id">
                            <a class="dropdown-item" href="#">
                                <div class="row">
                                    <div class="col-sm-3">
                                        <img :src="user.photo">
                                    </div>
                                    <div class="col-sm-7">
                                        <span>{{ user.name }}</span>
                                    </div>
                                    <div class="col-sm-2">
                                        <font-awesome-icon
                                            class="font-icon"
                                            v-if="ids.includes(user.id)"
                                            icon="fa-lg fa-solid fa-square-minus"
                                            @click="removeFriend(user.id)"
                                        />
                                        <font-awesome-icon
                                            v-else
                                            class="font-icon"
                                            icon="fa-lg fa-solid fa-square-plus"
                                            @click="addFriend(user)"
                                        />
                                    </div>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="col-sm-1">
                <button
                    type="button"
                    class="btn btn-primary pull-right"
                    @click="showFriends()"
                >
                    Построить
                </button>
            </div>
        </div>
        
        <div class="card" v-if="!isLoading" v-for="friend in friends" :key="friend.id" :style="getOpacity(friend.count)">
          <h5 class="card-header">
            {{ friend.name }}
            <span class="badge bg-danger float-end" @click="showDelete(friend)">X</span>
          </h5>
          <div class="card-body">
            <div class="row">
                <div class="col-sm-3">
                    <span class="avatar-panel mb-3"><img :src="friend.photo"></span>
                </div>
                <div class="col-sm-9">
                    <p>Пол: <span>{{ friend.male }}</span></p>
                    <p>Возраст: <span>{{ friend.age }}</span></p>
                    <p>Количество друзей: <span>{{ friend.counters.friends }}</span></p>
                    <p>Количество фотографий: <span>{{ friend.counters.photos }}</span></p>
                    <router-link :to="{ name: 'user', params: { id: friend.id }}" v-if="!friend.isPrivate" class="btn btn-primary">
                        Перейти на страницу
                    </router-link>
                    <div v-else class="alert alert-danger">
                        Приватный аккаунт
                    </div>
                </div>
            </div>
          </div>
        </div>
        <div class="text-center" v-else>
            <Loader />
        </div>
        

        <modal-window ref="modal" v-bind:size="'modal-md'">
            <template v-slot:title>
                <h5 class="modal-title">Подтверждение</h5>
            </template>
            <template v-slot:body>
                <yes-no :text="textDelete" :callback="deleteFriend" v-on:close-yes-no-modal="closeModal()" />
            </template>
        </modal-window>

    </div>
</template>
 
<script>
    import { mapActions, mapGetters, mapMutations } from 'vuex' 
    import ModalWindow from './ModalWindow.vue'
    import YesNo from './YesNo.vue'
    import Loader from './Loader.vue'

    let userId;

    export default {
        name: "List",
        data: function () {
            return {
                ids: [],
                textDelete: '',
                maxCount: 0,
                users: [],
                filter: '',
                show: false,
                isLoading: false
            }
        },
        components: {
            ModalWindow,
            YesNo,
            Loader
        },
        created() {
            //this.loadUsers();;
            this.ids = this.friends.map(v => v.id);
            this.setMaxCount(this.friends);
        },
        mounted() {
            document.addEventListener('click', this.domClick);
        },
        computed: {
            ...mapGetters(['friends'])
        },
        methods: {
            ...mapActions(['getUsers', 'getUserInfo', 'getFriends']),
            ...mapMutations(['updateFriends', 'updateUsers']),
            search() {
                if (this.filter.length === 0) {
                    this.users = [];
                    return;
                }
                this.getUsers(this.filter).then(data => {
                    const users = data.items.map(v => {
                        return {
                            id: v.id,
                            name: `${v.first_name} ${v.last_name}`,
                            photo: v.photo_200_orig
                        }
                    });
                    this.users = users;
                });
            },
            loadUsers() {
                this.getUsers().then(users => {
                    this.updateUsers(users);
                });
            },
            addFriend(friend) {
                const index = this.ids.findIndex(v => v.id === friend.id);

                if (index === -1) {
                    this.ids.push(friend.id);
                }
            },
            showFriends() {
                let friends = [];
                let promises = [];
                this.show = false;
                this.filter = '';
                this.isLoading = true;

                for (let i = 0; i < this.ids.length; i++) {
                    promises.push(this.timeOut(this.getFriends, this.ids[i], 1000 * i));
                    promises.push(this.timeOut(this.getUserInfo, this.ids[i], 1000 * i));
                }

                Promise.all(promises).then(data => {
                    const responce = this.sliceIntoChunks(data, 2);

                    for (let i = 0; i < responce.length; i++) {
                        friends.push(this.getDataFriends(responce[i]));
                    }

                    this.setMaxCount(friends);
                    this.updateFriends(friends);
                    this.isLoading = false;
                });
            },
            async timeOut(fn, arg, time = 500) {
                const result = await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(fn(arg));
                    }, time);
                });

                return result;
            },
            setMaxCount(values) {
                let count = 0;

                for (let value of values) {
                    if (value.count > count) {
                        count = value.count;
                    }
                }
                this.maxCount = count;
            },
            getOpacity(count) {
                const minOpacity = 0.6;

                if (this.maxCount === 0) {
                    return 'opacity: 1';
                }

                if (count === 0) {
                    return `opacity: ${minOpacity}`;
                }

                const opacity = ((1 - minOpacity) * (count/this.maxCount)) + minOpacity;

                return `opacity: ${opacity}`;
            },
            getDataFriends(data) {
                let userInfo = {};

                if (data[1].id !== -1) {
                    userInfo = {
                        id: data[1].id,
                        name: `${data[1].first_name} ${data[1].last_name}`,
                        photo: data[1].photo_200_orig,
                        male: data[1].sex === 2 ? 'мужский' : data[1].sex === 1 ? 'женский' : 'не указан',
                        age: data[1].bdate !== undefined ? this.getAge(data[1].bdate) : 'не указан',
                        counters: {
                            photos: data[1].counters.photos || 0,
                            friends: data[1].counters.friends || 0
                        }
                    }
                }

                return {
                    ...userInfo,
                    friends: data[0],
                    isPrivate: data[0].length && data[0][0].id === -1 ? true : false,
                    count: this.getCountFriends(data[0].map(v => v.id)),
                };
            },
            sliceIntoChunks(arr, chunkSize) {
                const res = [];
                for (let i = 0; i < arr.length; i += chunkSize) {
                    const chunk = arr.slice(i, i + chunkSize);
                    res.push(chunk);
                }
                return res;
            },
            getCountFriends(friends) {
                let count = 0;

                for(let value of this.ids) {
                    if (friends.includes(value)) {
                        count++;
                    }
                }
                return count;
            },
            removeFriend(id) {
                this.ids = this.ids.filter(v => v !== id);
            },
            closeModal() {
                this.$refs.modal.show = false;
            },
            deleteFriend() {
                this.removeFriend(userId);
                const friends = this.friends.filter(v => v.id !== userId).map(m => {
                    return {
                        ...m,
                        count: this.getCountFriends(m.friends.map(u => u.id))
                    };
                });
                this.setMaxCount(friends);
                this.updateFriends(friends);
            },
            showDelete(friend) {
                userId = friend.id;
                this.textDelete = `Вы уверены, что удалить ${friend.name}?`;
                this.$refs.modal.show = true;
            },
            getAge(date) {
                const dates = date.split('.');

                if (dates.length === 2) {
                    return 'Не указан';
                }

                const dateBirthday = new Date(dates[2], parseInt(dates[1]) - 1, dates[0]);
                let today = new Date();
                today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const dbToday = new Date(today.getFullYear(), dateBirthday.getMonth(), dateBirthday.getDate());
                let age = today.getFullYear() - dateBirthday.getFullYear();

                if (today < dbToday) {
                    age--;
                }
                return age;
            },
            domClick(e) {
                if (e.target.tagName === 'HTML') {
                    this.show = false;
                }
            }
        },
        beforeDestroy() {
            document.removeEventListener('click', this.domClick);
        }
    }
</script>
 