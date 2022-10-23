<template>
    <div v-if="show" class="modal-shadow" @click.self="closeModal">
        <div class="modal-dialog" :class="size">
            <div class="modal-content">
                <div class="modal-header">
                    <slot name="title">
                        <h3 class="modal-title">Заголовок</h3>
                    </slot>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" @click="closeModal" aria-label="Close"></button>
                </div>
                <slot name="body">
                    <div class="modal-body">
                        Дефолтный контент модального окна
                    </div>
                </slot>
            </div>
        </div>
    </div>    
</template>
 
<script>
    export default {
        name: "ModalWindow",
        data: function () {
            return {
                show: false,
                size: 'modal-md'
            }
        },
        props: ['size'],
        methods: {
            closeModal: function () {
                this.show = false
            }
        }
    }
</script>
 
<style>
    .modal-shadow {
        position: fixed;
        top: 0;
        left: 0;
        min-height: 100%;
        width: 100%;
        z-index: 100;
        background: rgba(0, 0, 0, 0.39);
    }
</style>