<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const pos = ref({ left: null, top: null });
const start = ref({ x: 0, y: 0 });
const moved = ref(false);
const elRef = ref(null);
const router = useRouter();
const route = useRoute();
const visible = ref(false);

function shouldShowForRoute(path) {
  if (!path) return true;
  const blocked = ['/login', '/forgot-password', '/register', '/logout'];
  return !blocked.includes(path.toLowerCase());
}

function loadPos() {
  try {
    const raw = localStorage.getItem('chatLauncherPos');
    if (raw) {
      const p = JSON.parse(raw);
      pos.value = p;
    } else {
      pos.value = { left: window.innerWidth - 84, top: window.innerHeight - 140 };
    }
  } catch {
    pos.value = { left: window.innerWidth - 84, top: window.innerHeight - 140 };
  }
}

function savePos() {
  localStorage.setItem('chatLauncherPos', JSON.stringify(pos.value));
}

function onPointerDown(e) {
  dragging.value = true;
  start.value = { x: e.clientX, y: e.clientY };
  moved.value = false;
  elRef.value.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!dragging.value) return;
  const dx = e.clientX - start.value.x;
  const dy = e.clientY - start.value.y;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved.value = true;
  start.value = { x: e.clientX, y: e.clientY };
  pos.value.left = Math.min(Math.max(8, pos.value.left + dx), window.innerWidth - 64);
  pos.value.top = Math.min(Math.max(8, pos.value.top + dy), window.innerHeight - 64);
}

function onPointerUp(e) {
  if (!dragging.value) return;
  dragging.value = false;
  try { elRef.value.releasePointerCapture(e.pointerId); } catch {}
  savePos();
  // If the user dragged and released, only reposition (do not open).
  // Open the window only when it was not moved (i.e., a click/tap).
  if (!moved.value) {
    showWindow.value = true;
  }
}

function openChat() {
  // navigate to chatbot page; if it doesn't exist, open /chatbot
  router.push('/chatbot').catch(() => {});
}

async function initLauncher() {
  try {
    if (router && typeof router.isReady === 'function') await router.isReady();
    if (document.readyState !== 'complete') {
      await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    }
  } catch (e) {
    // ignore
  }

  loadPos();
  // reposition if off-screen after resize
  window.addEventListener('resize', () => {
    pos.value.left = Math.min(pos.value.left || 0, window.innerWidth - 64);
    pos.value.top = Math.min(pos.value.top || 0, window.innerHeight - 64);
    savePos();
  });

  // only show if current route allows it; otherwise wait for route change
  if (shouldShowForRoute(route.path)) {
    visible.value = true;
  } else {
    const stop = watch(() => route.path, (p) => {
      if (shouldShowForRoute(p)) {
        visible.value = true;
        stop();
      }
    });
  }
}

onMounted(() => {
  initLauncher();
});
</script>

<template>
    <div v-if="visible"
    ref="elRef"
    role="button"
    aria-label="Open chat"
    tabindex="0"
    @click="openChat"
    @pointerdown.stop.prevent="onPointerDown"
    @pointermove.stop.prevent="onPointerMove"
    @pointerup.stop.prevent="onPointerUp"
    :style="{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 60 }"
    class="w-14 h-14 flex items-center justify-center rounded-full shadow-lg bg-primary text-white cursor-pointer select-none transition-transform active:scale-95"
  >
    <Icon name="ph:chat-teardrop-text-duotone" class="!w-6 !h-6" />

  </div>
</template>

<style scoped>
.w-14 { width: 56px; }
.h-14 { height: 56px; }
</style>
