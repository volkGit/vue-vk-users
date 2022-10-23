<template>
    <div>
        <p v-if="!show">{{ textSmall }}</p>
        <p v-else>{{ text }}</p>
        <a href="#" @click.prevent="updateText()" v-if="text.length > 100">{{ linkText }}</a>
    </div>
</template>

<script>

export default {
    name: "TextHide",
    data: function () {
        return {
            show: false,
            linkText: 'Показать полностью'
        }
    },   
    props: ['text'],
    computed: {
        textSmall: function() { 
            return this.text.length === 0 ? '' : this.text.length < 100 ? this.text : this.text.slice(0, 100) + '...';
        }
    },
    methods: {
        updateText() {
            this.linkText = this.show ? 'Показать полностью' : 'Скрыть';
            this.show = !this.show;
        }
    }
}
</script>