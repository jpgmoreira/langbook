<template>
    <transition name="toast-transition">
        <div class="toast-container" v-if="visible">
            <div class="d-flex align-items-center">
                <div class="toast-info"></div>
                <slot></slot>
            </div>
        </div>
    </transition>
</template>

<script>
    export default {
        props: {
            visible: {
                type: Boolean,
                required: true,
            },
        },
    };
</script>

<style scoped>
    .toast-container {
        position: fixed;
        top: 6px;
        right: 6px;
        padding: 12px;
        border-radius: 5px;
        z-index: 5;
    }
    .toast-transition-enter-active {
        animation: toast-animation 0.7s;
    }
    .toast-transition-leave-active {
        animation: toast-animation 0.7s reverse;
    }
    @keyframes toast-animation {
        0% {
            opacity: 0;
            transform: rotate(-8deg);
            top: -70px;
        }
        50% {
            transform: rotate(-5deg);
            top: 15px;
        }
        70% {
            transform: rotate(0deg);
            top: 6px;
        }
        90% {
            transform: rotate(1deg);
            top: 7px;
        }
        100% {
            opacity: 1;
            transform: rotate(0deg);
            top: 6px;
        }
    }
</style>
