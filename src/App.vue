<!--
  SPDX-License-Identifier: GPL-3.0-or-later
  Copyright (c) 2026 YHY_UNan
  Source: https://github.com/YU_UR/3D_Map
-->

<script setup lang="ts">
import JiangsuThreeMap from './components/map/JiangsuThreeMap.vue';
</script>

<template>
  <div class="app-shell">
    <JiangsuThreeMap />
  </div>
</template>

<style>
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #020603;
}

.app-shell {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
