import { createRouter, createWebHistory } from 'vue-router'
import User from './components/User.vue'
import List from './components/List.vue'

export default createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'home',
			component: List
		},
		{
			path: '/user/:id',
			name: 'user',
			component: User
		}
	]
});