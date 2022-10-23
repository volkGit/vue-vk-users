<template>
    <div>
        <div class="modal-body">
            {{text}}
        </div>

        <div class="modal-footer">
            <button class="btn btn-primary" type="button" @click="ok">Да</button>
            <button class="btn btn-secondary" type="button" @click="cancel">Нет</button>
        </div>
    </div>
</template>

<script>

export default {
    name: "YesNo",
    data: function () {
        return {
        }
    },
    props: ['text', 'callback'],
    methods: {
        ok() {
            this.callback();
            this.$emit('close-yes-no-modal');
        },
        cancel() {
            this.$emit('close-yes-no-modal');
        }
    }
}
</script>