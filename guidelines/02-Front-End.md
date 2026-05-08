# Chapter 2 · Front End

## 2.0 How to Use This Chapter
- Follow the **Beginner**, **Intermediate**, and **Expert** tracks in order or jump directly to the section that matches your skill set.
- Example snippets reference the real project. Open files side by side for context while reading.

## 2.1 Beginner Track · Build Your First Page
### Goal
Create a working page that appears in the sidebar, loads data, and matches corradAF styling.

### Step-by-step
1. **Scaffold the route**
   - Create folder `pages/sample-page/` and file `index.vue`.
   - Add `<script setup>` block with metadata:
     ```vue
     <script setup>
     definePageMeta({
       title: "Sample Page",
       middleware: ["auth"],
       breadcrumb: [
         { name: "Dashboard", path: "/dashboard" },
         { name: "Sample Page", path: "/sample-page" },
       ],
     })
     </script>
     ```
2. **Add layout and components**
   ```vue
   <template>
     <div class="space-y-6 p-6">
       <LayoutsBreadcrumb />
       <rs-card class="p-6 space-y-4">
         <h1 class="text-2xl font-semibold">Sample Page</h1>
         <p class="text-muted-foreground">Welcome to corradAF front end.</p>
       </rs-card>
     </div>
   </template>
   ```
3. **Introduce reactive data**
   ```vue
   <script setup>
   import { ref, computed } from "vue"

   const items = ref([
     { id: 1, name: "Generator", status: "Active" },
     { id: 2, name: "HVAC", status: "Maintenance" },
   ])

   const activeItems = computed(() =>
     items.value.filter(item => item.status === "Active")
   )
   </script>
   ```
4. **Display data using design system components**
   ```vue
   <rs-table :data="activeItems">
     <template #default="{ row }">
       <tr>
         <td>{{ row.id }}</td>
         <td>{{ row.name }}</td>
         <td>{{ row.status }}</td>
       </tr>
     </template>
   </rs-table>
   ```
5. **Expose the page in sidebar**
   - Add an entry in `navigation/index.js` (or use `/devtool/menu-editor` to persist through API).

6. **Test the page**
   - Run `yarn dev`, navigate to `/sample-page`, and confirm breadcrumb, layout, and table render correctly.

### Ready when
- Page renders with corradAF styling.
- Breadcrumb and navigation highlight the page.
- Reactive data updates the UI when you modify `items`.

## 2.2 Intermediate Track · Application Features
### Goal
Connect pages to real data, manage shared state, and customize the design system.

- **State management**
  - Create Pinia stores in `stores/`; e.g. `stores/user.js` for session info.
  - Use Composition API hooks:
    ```javascript
    const userStore = useUserStore()
    const fullName = computed(() => userStore.profile?.name ?? "Guest")
    ```
  - Enable persistence by setting `persist: true` in store definition.
- **Fetching data**
  - Use `useFetch` or `$fetch` to call Nitro APIs:
    ```javascript
    const { data, pending, error } = await useFetch("/api/tickets", {
      key: "tickets",
      server: false,
    })
    ```
  - Show loading states with `pending` and error toasts via `$toast.error`.
- **Forms with FormKit**
  - Use built-in inputs (`FormKit type="select"`) for consistency.
  - Keep form schemas in dedicated components when forms get complex.
  - Validate on submit and display toast feedback.
- **Styling & theming**
  - Extend Tailwind tokens in `tailwind.config.js`.
  - Add override styles in `assets/style/scss/custom/*.scss`.
  - Use CSS variables or SCSS maps if multiple themes required; load from `site-settings` via `useSiteSettings` composable.
- **Layout variations**
  - Adopt existing layouts (`default`, `empty`); create new ones under `layouts/` for specialized shells (e.g., dev tool layout).
  - Keep layout logic minimal—move heavy lifting to child components.
- **Navigation rules**
  - Use `meta.auth.role` in navigation entries to respect RBAC.
  - Optionally gate entire pages with `definePageMeta({ requiresAuth: true })`.

### Ready when
- You can build a page that loads data from server and persists user selections.
- Custom Tailwind tokens are reflected across the UI.
- Navigation hides or shows entries based on user roles.

## 2.3 Expert Track · Advanced Front-End Patterns
### Goal
Deliver production-ready experiences with reusable patterns, performance tuning, and testing.

- **Component architecture**
  - Break large pages into feature components (`components/FeatureName/`).
  - Use slots and render functions for highly configurable UI (e.g. exposing `<template #row="{ row }">` as RsTable does).
  - Document props/emits with JSDoc and TypeScript for DX.
- **Composables & utilities**
  - Place shared logic in `composables/` (e.g., `useTickets`, `usePagination`).
  - Use `onServerPrefetch` for SSR data requirements.
- **Performance**
  - Lazy-load heavy components with `defineAsyncComponent`.
  - Use `useLazyFetch` with keys to prevent duplicate requests.
  - Memoize expensive computed values or paginate large datasets.
- **Accessibility & internationalization**
  - Follow WCAG: ensure contrast, focus rings, ARIA labels.
  - Prepare text for localization by centralizing copy in composables or JSON files if required.
- **Testing strategy**
  - Component tests via `@vue/test-utils` + `vitest`.
  - E2E tests (Cypress/Playwright) for complex flows; include login helper to bypass UI sign-in.
- **Design tokens synchronization**
  - Sync theme settings with database via `/devtool/config/site-settings`.
  - Use watchers to apply runtime theme changes (see `composables/themeList.js`).

### Ready when
- You can ship new features without breaking shared components.
- Lighthouse scores remain high (>90) for target pages.
- Automated tests cover critical user journeys.

## 2.4 Component Usage Recipes
### rs-card
- Purpose: simple container with optional header/body/footer slots.
- Slots:
  - `default` (main content)
  - `header`, `body`, `footer`
- Example:
  ```vue
  <rs-card class="p-6 space-y-4">
    <template #header>
      <h2 class="text-xl font-semibold">Ticket Summary</h2>
    </template>
    <p>Total tickets: {{ total }}</p>
    <template #footer>
      <rs-button size="sm" @click="navigateTo('/work-order')">
        View Work Orders
      </rs-button>
    </template>
  </rs-card>
  ```

### rs-button
- Props: `variant` (`primary`, `secondary`, `danger`, `ghost`), `size` (`sm`, `md`, `lg`), `loading`, `disabled`.
- Emits native click events.
- Example:
  ```vue
  <rs-button variant="primary" :loading="isSaving" @click="save">
    <Icon name="mdi:content-save" size="18" />
    Save Changes
  </rs-button>
  ```

### rs-table
- Props:
  - `data`: array of rows to display.
  - `field`: optional array to control column order/labels.
  - `options`: stylistic flags (`variant`, `striped`, `borderless`).
  - `optionsAdvanced`: enable sorting, responsive card view, pagination.
- Slots:
  - `default` slot exposes `{ row, column, index }` for custom rendering.
  - Provide `#header` or `#empty` slots when needed.
- Basic example:
  ```vue
  <rs-table :data="tickets" :options="{ striped: true }">
    <template #default="{ row }">
      <tr>
        <td>{{ row.ticketId }}</td>
        <td>{{ row.title }}</td>
        <td>
          <rs-badge :variant="row.status === 'closed' ? 'success' : 'warning'">
            {{ row.status }}
          </rs-badge>
        </td>
      </tr>
    </template>
  </rs-table>
  ```
- Advanced usage:
  ```vue
  <rs-table
    :data="tickets"
    :field="['ticketId', 'title', 'status', 'dueDate']"
    :options-advanced="{ sortable: true, responsive: true }"
    advanced
  />
  ```

### rs-modal
- Props: `modelValue` (boolean), `title`, `size` (`sm`, `md`, `lg`, `xl`).
- Emits: `update:modelValue` to close modal.
- Pattern:
  ```vue
  <rs-modal :model-value="showModal" title="Create Ticket" @update:modelValue="showModal = $event">
    <template #body>
      <FormKit type="text" v-model="form.title" label="Title" />
      <FormKit type="textarea" v-model="form.description" label="Description" />
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <rs-button variant="ghost" @click="showModal = false">Cancel</rs-button>
        <rs-button variant="primary" :loading="isSubmitting" @click="submit">Submit</rs-button>
      </div>
    </template>
  </rs-modal>
  ```

### rs-alert
- Props: `variant` (`primary`, `success`, `warning`, `danger`), `icon`, `dismissible`.
- Example:
  ```vue
  <rs-alert variant="warning" :dismissible="true" @dismiss="showAlert = false">
    Scheduled maintenance starts at 5:00 PM.
  </rs-alert>
  ```

### rs-dropdown & rs-dropdown-item
- Use `rs-dropdown` as wrapper; `rs-dropdown-item` for actions.
- Example:
  ```vue
  <rs-dropdown>
    <template #trigger>
      <rs-button variant="ghost">
        Actions <Icon name="mdi:chevron-down" />
      </rs-button>
    </template>
    <rs-dropdown-item @click="edit(row)">Edit</rs-dropdown-item>
    <rs-dropdown-item variant="danger" @click="archive(row)">Archive</rs-dropdown-item>
  </rs-dropdown>
  ```

### FormKit inputs
- Global configuration in `formkit.config.js`.
- Usage pattern:
  ```vue
  <FormKit
    type="select"
    name="priority"
    label="Priority"
    :options="['Low', 'Medium', 'High']"
    v-model="form.priority"
    validation="required"
    validation-visibility="live"
  />
  ```
- Use `@submit="handleSubmit"` on `<FormKit type="form">` wrappers for grouped forms.

## 2.5 Quick Reference
- **Key directories**
  - `pages/` — auto-routed views.
  - `components/` — reusable UI; follow PascalCase.
  - `layouts/` — shell wrappers (`default`, `empty`, etc.).
  - `composables/` — shared logic hooks.
  - `stores/` — Pinia stores (persisted via plugin).
- **Essential commands**
  - `yarn dev` — local development server.
  - `yarn build` — production bundle.
  - `npx nuxi devtools enable` — enable Nuxt DevTools.
- **Design system components**
  - `rs-card`, `rs-table`, `rs-button`, `rs-modal`, `rs-dropdown`, `FormKit`.
- **Troubleshooting**
  - Hot module reload issues: restart `yarn dev`.
  - Missing component registration: ensure plugin file exports `defineNuxtPlugin`.
  - Layout misalignment: inspect Tailwind classes and check layout wrapper spacing.
