<template>
    <div>
        <a :href="link.url" v-if="link.photo === ''">
            {{ link.title }}
        </a>
        <a :href="link.url" v-else>
            <img :src="link.photo.url">
        </a>
    </div>
</template>

<script>

export default {
    name: "LinkPost",
    data: function () {
        return {
        }
    },   
    props: ['link'],
}
</script>