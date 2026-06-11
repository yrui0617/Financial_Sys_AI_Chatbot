<script setup>
import { ref, nextTick, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { watch } from 'vue'


definePageMeta({
  title: 'Chatbot',
  layout: 'empty',
  middleware: ['auth'],
  requiresAuth: true,
})

const router = useRouter()
const userStore = useUserStore()

const API = useRuntimeConfig().public.API_URL;

/* ------------------ UI STATE ------------------ */
const colorMode = ref('light')
const listRef = ref(null)

const conversations = ref([])
const messages = ref([])
const currentConversationId = ref(null)
const tempConversationCounter = ref(-1)

const newMessage = ref('')
const isSending = ref(false)
let abortController = null

/* ------------------ NAV ------------------ */
function goBack() {
  router.back()
}

/* ------------------ THEME ------------------ */
function toggleColorMode() {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
  if (colorMode.value === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/* ------------------ SCROLL ------------------ */
function scrollToBottom() {
  if (!listRef.value) return
  listRef.value.scrollTo({
    top: listRef.value.scrollHeight,
    behavior: 'smooth'
  })
}

/* ------------------ LOAD CONVERSATIONS ------------------ */
async function loadConversations() {
  try {
    const res = await $fetch(`${API}/conversation`, {
      params: { userId: userStore.userId }
    })

    conversations.value = res.data || []

    if (conversations.value.length > 0) {
      await selectConversation(conversations.value[0].id)
    } else {
      await createConversation()
    }
  } catch (err) {
    console.error('loadConversations error:', err)
  }
}


/* ------------------ CREATE CONVERSATION ------------------ */
function createConversation() {
  const tempId = tempConversationCounter.value--

  const newConv = {
    id: tempId,
    title: 'New Chat',
    isTemp: true,
    isAutoTitle: true,
    messages: []
  }

  conversations.value.unshift(newConv)
  selectConversation(tempId)
}

function isTempConversation(id) {
  return typeof id === 'number' && id < 0
}

/* ------------------ LOAD MESSAGES ------------------ */
async function loadMessages(conversationId) {
  try {
    const res = await $fetch(`${API}/messages`, {
      params: { conversationId }
    })

    messages.value = res.data || []

    // ✅ AUTO TITLE UPDATE (SAFE HERE)
    const conv = conversations.value.find(
      c => c.id === conversationId
    )

    if (conv && messages.value.length > 0) {
      const firstUserMsg = messages.value.find(
        m => m.role === 'user'
      )

      if (
        firstUserMsg &&
        (conv.isAutoTitle || !conv.title || conv.title === 'New Chat')
      ) {
        conv.title = firstUserMsg.content.slice(0, 30)
      }
    }

    scrollToBottom()

  } catch (err) {
    console.error('loadMessages error:', err)
    messages.value = []
  }
}

/* ------------------ SELECT CONVERSATION ------------------ */
async function selectConversation(id) {
  currentConversationId.value = id
  await loadMessages(id)
}

/* ------------------ SEND MESSAGE ------------------ */
const isThinking = ref(false)

async function sendMessage() {
  // ✅ CANCEL IF ALREADY SENDING
  if (isSending.value) {
    if (abortController) {
      abortController.abort()
    }
    isSending.value = false
    isThinking.value = false
    return
  }

  isSending.value = true
  isThinking.value = true
  
  const text = newMessage.value.trim()
  if (!text || !currentConversationId.value) {
    isSending.value = false
    isThinking.value = false
    return
  }
  // PUSH USER MESSAGE
  messages.value.push({
    role: 'user',
    content: text
  })

  newMessage.value = ''

  await nextTick()
  scrollToBottom()

  // CREATE ABORT CONTROLLER FOR THIS REQUEST
  abortController = new AbortController()

  let conv = conversations.value.find(
    c => c.id === currentConversationId.value
  )

  // 🧠 HANDLE TEMP CONVERSATION
  if (conv?.isTemp) {
    try {
      const createRes = await $fetch(`${API}/conversation`, {
        method: 'POST',
        body: {
          userId: userStore.userId,
          title: 'New Chat'
        },
        signal: abortController.signal
      })

      const actualId = createRes.conversationId

      // update conversation locally
      conv.id = actualId
      conv.isTemp = false
      currentConversationId.value = actualId

      // ✅ GENERATE TITLE
      if (conv.isAutoTitle) {
        const newTitle = text
          .replace(/[^\w\s]/g, '')
          .trim()
          .slice(0, 30)

        // update frontend instantly
        conv.title = newTitle
        conv.isAutoTitle = false

        // UPDATE API TO INCLUDE TITLE
        await $fetch(`${API}/conversation/title`, {
          method: 'PUT',
          body: {
            conversationId: actualId,
            title: newTitle
          },
          signal: abortController.signal
        })
      }

    } catch (err) {
      // ✅ CHECK IF ABORTED
      if (err?.name === 'AbortError') {
        console.log('Request cancelled')
        return
      }

      console.error('createConversation error:', err)

      messages.value.push({
        role: 'assistant',
        content: '❌ Unable to create conversation.'
      })
      return
    }
  }

  isSending.value = true

  try {
    const res = await $fetch(`${API}/chat`, {
      method: 'POST',
      body: {
        message: text,
        userId: userStore.userId,
        roles: userStore.roles,
        conversationId: currentConversationId.value
      },
      signal: abortController.signal
    })

    messages.value.push({
      role: 'assistant',
      content: res.reply
    })
    isThinking.value = false
    await nextTick()
    scrollToBottom()

  } catch (err) {
    // CHECK IF ABORTED
    if (err?.name === 'AbortError') {
      console.log('Request cancelled by user')
      // Remove the user message that was added
      messages.value.pop()
      isThinking.value = false
      return
    }

    console.error("CHAT ERROR:", err)

    messages.value.push({
      role: 'assistant',
      content: ''
    })
    isThinking.value = false

    await nextTick()
    scrollToBottom()
  } finally {
    isSending.value = false
    isThinking.value = false
  }
}
//------------------ VOICE INPUT ------------------ //
const isRecording = ref(false)

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition

let recognition = null

if (SpeechRecognition) {
  recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.continuous = false
  recognition.interimResults = false

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    newMessage.value = transcript
  }

  recognition.onend = () => {
    isRecording.value = false
  }
}

function toggleMic() {
  if (!recognition) {
    alert("Speech recognition not supported in this browser")
    return
  }

  if (isRecording.value) {
    recognition.stop()
    isRecording.value = false
  } else {
    recognition.start()
    isRecording.value = true
  }
}
//------------------ EDIT & DELETE CONVERSATION ------------------ //
const openMenuId = ref(null)
const editingId = ref(null)
const editTitle = ref('')
function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function renameTitle(conv) {
  editingId.value = conv.id
  editTitle.value = conv.title
  openMenuId.value = null
}

async function saveEdit(conv) {
  if (!editTitle.value.trim()) return

  conv.title = editTitle.value

  // 🔥 call backend
  await $fetch(`${API}/conversation/title`, {
    method: 'PUT',
    body: {
      conversationId: conv.id,
      title: editTitle.value
    }
  })
  editingId.value = null
}

const showDeleteModal = ref(false)
const deleteTargetId = ref(null)

function openDeleteModal(id) {
  deleteTargetId.value = id
  showDeleteModal.value = true
  this.openMenuId = null
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteTargetId.value = null
}

async function confirmDelete() {
  try {
    await $fetch(`${API}/conversation/${deleteTargetId.value}`, {
      method: 'DELETE'
    })

    conversations.value = conversations.value.filter(
      c => c.id !== deleteTargetId.value
    )

    if (currentConversationId.value === deleteTargetId.value) {
      currentConversationId.value = null
      messages.value = []
    }

  } catch (err) {
    console.error('Delete error:', err)
  } finally {
    closeDeleteModal()
  }
}

const isSidebarOpen = ref(false)

function handleResize() {
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false
  } else {
    isSidebarOpen.value = true
  }
}

/* ------------------ KEYBOARD ------------------ */
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

/* ------------------ INIT ------------------ */
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  loadConversations()
  const saved = localStorage.getItem('colorMode')
  if (saved) colorMode.value = saved
  if (colorMode.value === 'dark') {
    document.documentElement.classList.add('dark')
  }
})
watch(colorMode, (val) => {
  localStorage.setItem('colorMode', val)
})

/* ------------------ TITLE ------------------ */
const currentTitle = computed(() => {
  const conv = conversations.value.find(
    c => c.id === currentConversationId.value
  )
  return conv?.title || 'Chatbot'
})

watch(messages, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })
</script>

<template>
  <div
  v-if="isThinking"
  class="fixed inset-0 z-50"
  >
  </div>

  <div
    class="h-screen min-h-screen overflow-hidden bg-gradient-to-br from-emerald-100 via-lime-100 to-white text-slate-900 transition-colors duration-300 dark:from-black dark:via-zinc-950 dark:to-neutral-900 dark:text-zinc-100"
    @click="openMenuId = null; if (editingId) editingId = null"
  >
    <div class="flex h-screen">

      <div v-if="showDeleteModal" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div
          class="w-96 rounded-xl p-5 shadow-2xl border backdrop-blur-2xl"
          :class="colorMode === 'dark'
            ? 'bg-zinc-950/90 border-white/10 text-zinc-100'
            : 'bg-white border-gray-200 text-gray-800'"
        >

          <h2 class="text-lg font-semibold mb-2">Delete Conversation</h2>

          <p class="text-sm opacity-80 mb-4">
            Are you sure you want to delete this chat? This action cannot be undone.
          </p>

          <div class="flex justify-end gap-2">

            <button
              @click="closeDeleteModal"
              class="px-3 py-1 rounded border"
              :class="colorMode === 'dark'
                ? 'border-white/15 hover:bg-white/10 text-zinc-100'
                : 'border-gray-300 hover:bg-gray-100'"
            >
              Cancel
            </button>

            <button
              @click="confirmDelete"
              class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Delete
            </button>

          </div>
        </div>
      </div>

      <!-- SIDEBAR -->
      <aside
        v-show="isSidebarOpen"
        class="flex flex-col w-80 p-4 gap-4 border border-white/40 bg-white/70 backdrop-blur-xl shadow-2xl dark:bg-zinc-950/75 dark:border-white/10 dark:shadow-black/70"
      >

        <button @click="goBack" class="p-2 rounded-md border border-transparent hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100 dark:hover:bg-white/10">
          ⬅ Back
        </button>

        <button
          @click="createConversation()"
          class="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-lime-400 text-white px-4 py-3 rounded-2xl shadow-lg shadow-emerald-900/20 transition dark:from-white dark:to-zinc-300 dark:text-black dark:hover:from-zinc-100 dark:hover:to-white dark:shadow-black/50"
        >
          + New Chat
        </button>

        <div class="flex-1 overflow-auto space-y-2">
          <div
            v-for="c in conversations"
            :key="c.id"
            class="relative group flex items-center justify-between p-3 rounded-3xl cursor-pointer transition shadow-sm"
            :class="[
              c.id === currentConversationId
                ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-200/80 shadow-emerald-100/80 dark:bg-white/[0.16] dark:text-white dark:border-white/20 dark:shadow-black/30'
                : 'bg-white/70 text-slate-700 border border-white/60 hover:bg-emerald-50 hover:text-emerald-950 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100/70 dark:bg-white/[0.05] dark:text-zinc-300 dark:hover:bg-white/[0.12] dark:hover:text-white dark:border-white/10 dark:hover:border-white/20'
            ]"
          >

          <!-- TITLE / EDIT INPUT -->
          <div class="flex-1" @click="selectConversation(c.id)">

            <!-- NORMAL TITLE -->
            <span v-if="editingId !== c.id">
              {{ c.title }}
            </span>

            <!-- EDIT MODE -->
            <input
              v-else
              @click.stop
              v-model="editTitle"
              @keydown.enter="saveEdit(c)"
              class="w-full px-2 py-1 rounded border bg-white text-black dark:bg-black/60 dark:border-white/15 dark:text-white dark:focus:border-white/35"
            />
          </div>

          <!-- 3 DOT BUTTON -->
          <div class="relative">
            <button
              @click.stop="toggleMenu(c.id)"
              class="opacity-0 group-hover:opacity-100 transition p-1 rounded-full dark:hover:bg-white/10"
            >
              <svg class="w-6 h-6 text-gray-800 dark:text-zinc-100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 12h.01m6 0h.01m5.99 0h.01"/>
              </svg>
            </button>

            <!-- DROPDOWN -->
            <div
              v-if="openMenuId === c.id"
              @click.stop
              class="absolute right-0 mt-2 w-36 rounded-lg shadow-xl border z-40 bg-white border-gray-200 dark:bg-zinc-950/95 dark:border-white/10 dark:text-zinc-100 dark:backdrop-blur-xl"
            >

              <!-- RENAME -->
              <div
                @click="renameTitle(c)"
                class="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <svg class="w-6 h-6 text-gray-800 dark:text-zinc-100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"/>
                </svg>
                <span>Rename</span>
              </div>

              <!-- DELETE -->
              <div
                @click="openDeleteModal(c.id); openMenuId = null"
                class="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer dark:text-zinc-100"
              >
                <svg class="w-6 h-6 text-gray-800 dark:text-zinc-100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                </svg>
                <span>Delete</span>
              </div>

            </div>
          </div>

        </div>

      </div>

        <button @click="toggleColorMode"
          class="p-2 border rounded-md flex items-center justify-center gap-2 bg-white/60 border-emerald-200/70 text-emerald-900 transition hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white hover:border-emerald-400 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100 dark:hover:bg-none dark:hover:bg-white/10 dark:hover:text-zinc-100">

          <!-- LIGHT MODE ICON -->
          <svg v-if="colorMode === 'light'"
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M18.364 18.364l-1.414-1.414M7.05 7.05L5.636 5.636" />
          </svg>

          <!-- DARK MODE ICON -->
          <svg v-else
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 12.79A9 9 0 0111.21 3 7 7 0 1012 21a9 9 0 009-8.21z" />
          </svg>
          Theme Toggle
        </button>

      </aside>

      <!-- CHAT -->
      <main class="flex-1 flex flex-col overflow-hidden min-h-0">

        <div
          class="p-4 border-b text-center font-bold border-white/40 bg-white/70 backdrop-blur-xl text-emerald-900 shadow-sm dark:bg-zinc-950/70 dark:border-white/10 dark:text-white dark:shadow-black/50 relative"
        >
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="md:hidden absolute left-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg border border-transparent hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
          >
          <div v-if="!isSidebarOpen">
            <svg class="w-6 h-6 text-gray-800 dark:text-zinc-100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 10 1.99994 1.9999-1.99994 2M11 5v14m-7 0h16c.5523 0 1-.4477 1-1V6c0-.55228-.4477-1-1-1H4c-.55228 0-1 .44772-1 1v12c0 .5523.44772 1 1 1Z"/>
            </svg>
          </div>
          <div v-else>
            <svg class="w-6 h-6 text-gray-800 dark:text-zinc-100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.99994 10 6 11.9999l1.99994 2M11 5v14m-7 0h16c.5523 0 1-.4477 1-1V6c0-.55228-.4477-1-1-1H4c-.55228 0-1 .44772-1 1v12c0 .5523.44772 1 1 1Z"/>
            </svg>
          </div>
          </button>
          {{ currentTitle }}
        </div>

        <div ref="listRef" class="flex-1 overflow-auto p-4">
          <div class="max-w-3xl mx-auto space-y-4">
            
            <div v-for="m in messages" :key="m.id">  
              <!-- USER -->
              <div v-if="m.role === 'user'" class="flex justify-end">
                <div class="bg-emerald-500 text-white px-5 py-3 rounded-3xl shadow-2xl whitespace-pre-line max-w-xs md:max-w-md lg:max-w-lg break-words text-left border border-white/20 dark:bg-white dark:text-black dark:border-white/20 dark:shadow-black/50">
                  {{ m.content }}
                </div>
              </div>

              <!-- ASSISTANT -->
              <div v-else class="text-left">
                <div
                  class="px-5 py-3 rounded-3xl inline-block shadow-lg whitespace-pre-line bg-white/80 text-slate-900 border border-white/50 dark:bg-white/10 dark:text-zinc-100 dark:border-white/10 dark:shadow-black/30 dark:backdrop-blur-xl"
                >
                  {{ m.content }}
                </div>
              </div>
            </div>

            <div v-if="isThinking" class="flex justify-start">
              <div class="bg-emerald-100 dark:bg-white/10 dark:border dark:border-white/10 px-4 py-2 rounded-2xl inline-flex items-center gap-2 shadow max-w-xs dark:shadow-black/30 dark:backdrop-blur-xl">
                <svg class="w-5 h-5 animate-spin text-black-700 dark:text-zinc-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-sm text-black-800 dark:text-zinc-200">Thinking...</span>
              </div>
            </div>
          </div>
        </div>
        <!-- TEXT AREA -->
        <div class="p-4 sticky bottom-0 bg-white/75 backdrop-blur-xl border-t border-white/50 z-20 shadow-inner dark:bg-zinc-950/75 dark:border-white/10 dark:shadow-black/70">
          <div class="max-w-3xl mx-auto flex flex-row justify-center items-center gap-3">
            <textarea
              v-model="newMessage"
              @keydown="handleKeydown"
              rows="1"
              class="flex-1 min-h-[56px] rounded-3xl resize-none bg-white/85 border border-white/60 px-4 py-3 text-slate-900 placeholder-slate-500 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-white/[0.08] dark:border-white/10 dark:text-white dark:placeholder-zinc-500 dark:focus:border-white/25 dark:focus:ring-white/10"
              placeholder="Type your message..."
            />
             <!-- MICROPHONE BUTTON -->
            <div class="relative">
              <button @click="toggleMic" class="group relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 active:scale-95 dark:bg-white/10 dark:border dark:border-white/10 dark:shadow-black/30 dark:focus:ring-white/20" aria-label="Start voice recording">
                  <svg v-if="!isRecording"
                  xmlns="http://www.w3.org/2000/svg" 
                  class="h-4 w-4 text-slate-600 transition-colors group-hover:text-emerald-500 dark:text-zinc-200 dark:group-hover:text-white" 
                  fill="none" viewBox="0 0 24 24" 
                  stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <!-- STOP ICON -->
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
              </button>
            </div>

            <!-- SEND BUTTON -->
            <button
              @click="sendMessage()"
              :disabled="!newMessage.trim() && !isSending"
              class="inline-flex h-12 items-center justify-center rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-400 hover:to-lime-400 disabled:cursor-not-allowed disabled:opacity-50 dark:from-white dark:to-zinc-300 dark:text-black dark:hover:from-zinc-100 dark:hover:to-white dark:shadow-black/50"
            >
              {{ isSending ? 'Cancel' : 'Send' }}
            </button>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>
