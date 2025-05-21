<template>
    <div class="timer-control">
        <div class="timer-display">{{ formatTime(timer) }}</div>
        <div class="controls">
            <button @click="toggleTimer" class="btn" :class="timerRunning ? 'btn-secondary' : 'btn-primary'">
                {{ timerRunning ? 'Pause' : 'Start' }}
            </button>
            <button @click="resetTimer" class="btn btn-outline">Reset</button>
        </div>
        <div class="mt-4">
            <label class="form-label">Set Duration (minutes)</label>
            <input type="number" v-model="timerDuration" class="form-input" min="1" :disabled="timerRunning">
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
    initialDuration: {
        type: Number,
        default: 10 // in minutes
    }
})

const emit = defineEmits(['timerEnd', 'timerUpdate'])

const timer = ref(props.initialDuration * 60)
const timerDuration = ref(props.initialDuration)
const timerRunning = ref(false)
const timerInterval = ref(null)

function toggleTimer() {
    if (timerRunning.value) {
        clearInterval(timerInterval.value)
        timerRunning.value = false
    } else {
        if (timer.value === 0) {
            timer.value = timerDuration.value * 60
        }
        timerInterval.value = setInterval(() => {
            if (timer.value > 0) {
                timer.value--
                emit('timerUpdate', timer.value)
            } else {
                clearInterval(timerInterval.value)
                timerRunning.value = false
                emit('timerEnd')
            }
        }, 1000)
        timerRunning.value = true
    }
}

function resetTimer() {
    clearInterval(timerInterval.value)
    timerRunning.value = false
    timer.value = timerDuration.value * 60
    emit('timerUpdate', timer.value)
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

onBeforeUnmount(() => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value)
    }
})
</script>