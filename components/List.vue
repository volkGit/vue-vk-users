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
                    <ul class="dropdown-menu" :class="{'show': show && usersList.length > 0}">
                        <li v-for="user in usersList" :key="user.id">
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
                                            @click="removeUser(user.id)"
                                        />
                                        <font-awesome-icon
                                            v-else
                                            class="font-icon"
                                            icon="fa-lg fa-solid fa-square-plus"
                                            @click="addUser(user)"
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
                    @click="getFriendsInList()"
                >
                    Построить
                </button>
            </div>
        </div>
        
        <div class="row">
            <div class="col-sm-3">
                <ul class="nav flex-column">
                  <li class="nav-item" :class="{'active' : tab === 0}" @click="tab = 0">
                    <a class="nav-link" href="#">Исходный список</a>
                  </li>
                  <li class="nav-item" :class="{'active' : tab === 1}" @click="tab = 1">
                    <a class="nav-link" href="#">Друзья</a>
                  </li>
                </ul>
            </div>
            <div class="col-sm-9">
                <div v-if="tab === 0">
                    <div class="card" v-for="user in users" :key="user.id">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-sm-2">
                                    <span class="avatar-panel-small"><img :src="user.photo"></span>
                                </div>
                                <div class="col-sm-10">
                                    <h5>{{ user.name }}</h5>
                                    <span class="badge bg-danger float-end mt-30" @click="showDelete(user)">X</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="tab === 1">
                    <div class="card" v-for="friend in friends" :key="friend.id" :style="getOpacity(friend.count)">
                      <h5 class="card-header">
                        {{ friend.name }}
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
                                    <span v-if="friend.isBanned">Блокированный аккаунт</span>
                                    <span v-else-if="friend.isDeleted">Аккаунт удалён</span>
                                    <span v-else>Приватный аккаунт</span>
                                </div>
                            </div>
                        </div>
                      </div>
                    </div>
                    <div class="text-center" v-if="isLoading">
                        <Loader />
                    </div>
                </div>
                
            </div>
        </div>
        

       
        

        <modal-window ref="modal" v-bind:size="'modal-md'">
            <template v-slot:title>
                <h5 class="modal-title">Подтверждение</h5>
            </template>
            <template v-slot:body>
                <yes-no :text="textDelete" :callback="deleteUser" v-on:close-yes-no-modal="closeModal()" />
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
                tab: 1,
                maxCount: 0,
                usersList: [],
                filter: '',
                show: false,
                isLoading: false,
                isScroll: false
            }
        },
        components: {
            ModalWindow,
            YesNo,
            Loader
        },
        created() {
            this.ids = this.users.map(v => v.id);
            this.setMaxCount(this.friends);
        },
        mounted() {
            document.addEventListener('click', this.domClick);
            this.scroll();
        },
        computed: {
            ...mapGetters(['friends', 'users', 'friendsAll'])
        },
        methods: {
            ...mapActions(['getUsers', 'getUserInfo', 'getFriends']),
            ...mapMutations(['updateFriends', 'updateUsers', 'updateFriendsAll']),
            scroll () {
                window.onscroll = () => {
                    let bottomOfWindow = document.documentElement.scrollTop + window.innerHeight === document.documentElement.offsetHeight;
             
                    if (bottomOfWindow && this.tab === 1 && !this.isLoading && !this.isScroll) {
                        let length = this.friends.length;
                        this.isScroll = true;
                        this.showFriends(length, length + 5);
                        setTimeout(() => {
                            this.isScroll = false;
                        }, 1000);
                    }
                }
            },
            sortArray(array) {
                return array.sort(function(a, b) {
                    a = a.name.toLowerCase();
                    b = b.name.toLowerCase();

                    if (a < b)
                        return -1;
                    if (a > b)
                        return 1;
                    return 0;
                });
            },
            search() {
                if (this.filter.length === 0) {
                    this.usersList = [];
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
                    this.usersList = users;
                });
            },
            addUser(user) {
                const index = this.ids.findIndex(v => v.id === user.id);
                let users = this.users;

                if (index === -1) {
                    this.ids.push(user.id);
                    users.push(user);
                    this.updateUsers(users);
                }
            },
            getFriendsInList() {
                let promises = [];
                let friendsIds = [];
                let friendsList = [];
                this.show = false;
                this.filter = '';
                this.updateFriends([]);

                if (this.ids.length === 0) {
                    return;
                }
                this.isLoading = true;

                for (let i = 0; i < this.ids.length; i++) {
                    promises.push(this.timeOut(this.getFriends, this.ids[i], 1000 * i));
                }

                Promise.all(promises).then(data => {
                    for (let i = 0; i < data.length; i++) {
                        for (let j = 0; j < data[i].length; j++) {
                            if (!friendsIds.includes(data[i][j].id) && data[i][j] !== -1) {
                                friendsIds.push(data[i][j].id);
                                friendsList.push(data[i][j]);
                            }
                        }
                    }

                    friendsList = this.sortArray(friendsList);
                    this.updateFriendsAll(friendsList);
                    this.showFriends();
                });
            },
            showFriends(from = 0, count = 5) {
                let friends = from === 0 ? [] : this.friends;
                let promises = [];
                let users = this.friendsAll.slice(from, count);
                
                if (users.length === 0) {
                    return;
                }

                this.isLoading = true;

                for (let i = 0; i < users.length; i++) {
                    promises.push(this.timeOut(this.getFriends, users[i].id, 1000 * i));
                    promises.push(this.timeOut(this.getUserInfo, users[i].id, 1000 * i));
                }

                Promise.all(promises).then(data => {
                    const responce = this.sliceIntoChunks(data, 2);

                    for (let i = 0; i < responce.length; i++) {
                        if (responce[i][1] !== -1) {
                            const idx = friends.findIndex(v => v.id === responce[i][1].id);

                            if (idx === -1) {
                                friends.push(this.getDataFriends(responce[i])); 
                            }
                        }
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

                if (data[1] !== -1) {
                    userInfo = {
                        id: data[1].id,
                        name: `${data[1].first_name} ${data[1].last_name}`,
                        photo: data[1].photo_200_orig,
                        male: data[1].sex === 2 ? 'мужский' : data[1].sex === 1 ? 'женский' : 'не указан',
                        age: data[1].bdate !== undefined ? this.getAge(data[1].bdate) : 'не указан',
                        counters: {
                            photos: data[1].counters !== undefined ? data[1].counters.photos || 0 : 0,
                            friends: data[1].counters !== undefined ? data[1].counters.friends || 0 : 0
                        },
                        isBanned: data[1].deactivated !== undefined && data[1].deactivated === 'banned' ? true : false,
                        isDeleted: data[1].deactivated !== undefined && data[1].deactivated === 'deleted' ? true : false
                    }
                }

                return {
                    ...userInfo,
                    friends: data[0],
                    isPrivate: data[0].length && data[0][0] === -1 ? true : false,
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

                if (friends[0] === -1) {
                    return 1;
                }

                for(let value of this.ids) {
                    if (friends.includes(value)) {
                        count++;
                    }
                }
                return count;
            },
            removeUser(id) {
                this.ids = this.ids.filter(v => v !== id);
                this.users = this.users.filter(v => v.id !== id);
            },
            closeModal() {
                this.$refs.modal.show = false;
            },
            deleteUser() {
                this.removeUser(userId);
                const users = this.users.filter(v => v.id !== userId);
                this.updateUsers(users);
            },
            showDelete(friend) {
                userId = friend.id;
                this.textDelete = `Вы уверены, что хотите удалить ${friend.name}?`;
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
 