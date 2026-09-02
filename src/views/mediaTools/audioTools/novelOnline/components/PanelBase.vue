<template>
  <div class="panel-mask" @click.self="$emit('close')">
    <div class="panel-card">
      <div class="panel-head">
        <h3>{{ title }}</h3>
        <button class="icon-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="panel-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' }
})
defineEmits(['close'])
</script>
