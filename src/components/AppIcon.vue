<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
})

const paths = {
  home: 'M3 10.5 12 3l9 7.5M5.5 8.8V20h4.5v-5.5h4V20h4.5V8.8',
  hanger: 'M12 8.2a2.3 2.3 0 1 0-2.3-2.3M12 8.2v1.6l-8.4 6.1a1 1 0 0 0 .6 1.8h15.6a1 1 0 0 0 .6-1.8L12 9.8',
  plus: 'M12 5v14M5 12h14',
  layers: 'M12 3 3 7.5 12 12l9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  settings: 'M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  check: 'M5 12.5 9.5 17 19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  chevron: 'M9 6l6 6-6 6',
  filter: 'M4 6h16M7 12h10M10 18h4',
  drop: 'M12 3.5S6 10 6 14a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  shield: 'M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z',
  heart: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  recycle: 'M7 19H4.5l3-5M17 19h2.5l-3-5M9 5.5l1.7-2.5h2.6L15 5.5M8 11 6 7.5M16 11l2-3.5M9 19h6',
}
</script>

<template>
  <svg class="app-icon" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path :d="paths[name]" />
  </svg>
</template>
