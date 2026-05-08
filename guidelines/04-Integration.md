# Chapter 4 · Integration

## 4.0 How to Use This Chapter
- Start with the Beginner track for simple plugin additions.
- Progress to Intermediate when you need backend proxies or environment-specific setups.
- Use Expert guidance for enterprise integrations, security hardening, and monitoring.

## 4.1 Beginner Track · Add a Third-party Plugin
### Goal
Install a Vue plugin, wire it into Nuxt, and display it on a page.

### Prerequisites
- You are on a feature branch with the latest main merged.
- You have reviewed `plugins/` to match existing naming conventions.
- Decide whether the plugin needs client-only rendering (browser APIs).

### Step-by-step
1. **Install the dependency**
   - Use the project package manager (default is Yarn):
     ```bash
     yarn add vue3-apexcharts
     ```
   - Commit lockfile updates with your feature work.
2. **Register the plugin with Nuxt**
   - File: `plugins/apex-chart.client.ts` (use `.client` when the library touches `window` or DOM).
   ```ts
   import VueApexCharts from "vue3-apexcharts"

   export default defineNuxtPlugin((nuxtApp) => {
     nuxtApp.vueApp.component("VueApexCharts", VueApexCharts)
   })
   ```
   - Prefer `.ts` so TypeScript can infer props and improve DX.
3. **Render the component inside a CORRAD card**
   - File: `pages/example/charts.vue`
   ```vue
   <template>
     <rs-card class="p-6 space-y-4">
       <h2 class="text-lg font-semibold">Pipeline Velocity</h2>
       <VueApexCharts
         type="line"
         height="280"
         :options="chartOptions"
         :series="chartSeries"
       />
     </rs-card>
   </template>

   <script setup lang="ts">
   const chartOptions = {
     chart: { toolbar: { show: false } },
     stroke: { curve: "smooth" },
   }

   const chartSeries = [
     { name: "MQLs", data: [15, 22, 28, 31, 27, 33] },
     { name: "SQLs", data: [9, 14, 16, 19, 18, 21] },
   ]
   </script>
   ```
   - Wrap in `<client-only>` if hydration errors appear.
4. **Verify Local Experience**
   - `yarn dev` renders the chart without warnings or hydration errors.
   - Hot reload updates the chart when `chartSeries` changes.
   - `yarn lint` passes (plugin file respects project lint rules).

### Troubleshooting
- **SSR crash (`window` undefined):** rename file to `.client.ts` or guard with `if (!process.client) return`.
- **Component unknown:** confirm `VueApexCharts` matches the registered name and the plugin file exports `defineNuxtPlugin`.
- **Styles off-brand:** wrap in `rs-card`, use Tailwind utilities, and inspect via Theme guidelines.

### Ready when
- The plugin renders consistently across hot reloads and refreshes.
- No hydration or TypeScript errors appear in the console.
- Design review signs off on alignment with CORRAD AF components.

## 4.2 Intermediate Track · Connecting to External APIs
### Goal
Securely call third-party services, manage secrets, and provide consistent responses.

- **Environment & runtime configuration**
  - Add secrets to `.env.example` and `.env`:
    ```
    METRICS_API_URL="https://api.example.com"
    METRICS_API_KEY="your-key"
    ```
  - Expose them via `nuxt.config.ts`:
    ```ts
    export default defineNuxtConfig({
      runtimeConfig: {
        metrics: {
          apiUrl: process.env.METRICS_API_URL,
          apiKey: process.env.METRICS_API_KEY,
        },
      },
    })
    ```
  - Document new environment variables in the integration appendix or project README.
- **Server proxy**
  - File: `server/api/metrics/index.get.ts`
    ```ts
    export default defineEventHandler(async (event) => {
      const { metrics } = useRuntimeConfig()

      try {
        const response = await $fetch(`${metrics.apiUrl}/summary`, {
          headers: { Authorization: `Bearer ${metrics.apiKey}` },
        })

        return {
          success: true,
          data: response,
        }
      } catch (error) {
        const err = error as FetchError
        event.node.res.statusCode = err.statusCode || 502

        return {
          success: false,
          error: {
            message: "Unable to fetch metrics summary.",
            detail: err.data?.message ?? err.message,
            code: err.statusCode ?? "METRICS_UPSTREAM_ERROR",
          },
        }
      }
    })
    ```
  - Validate any inbound params (query/body) using Zod and strip dangerous fields before forwarding.
  - Add `useLogger("metrics")` logs for both success (debug) and failure (error) paths.
- **Client consumption**
  - Consume the proxy from a page or composable:
    ```ts
    const { data, error, pending } = await useFetch("/api/metrics")

    watch(error, (err) => {
      if (err) useToast().error("Metrics service is currently unavailable.")
    })
    ```
  - Ensure keys stay server-side; keep payloads minimal and cache when possible (`staleMaxAge`).
- **Testing**
  - Hit `/api/metrics` using the DevTool API editor to confirm the JSON shape.
  - Mock the upstream API in unit tests (MSW, vi.mock) and assert both success and failure responses.
  - Stage environment smoke test: redeploy with dummy credentials and verify alerting.

### Ready when
- External API keys never reach the browser or client logs.
- Errors show user-friendly messages while logs contain traceable metadata.
- Integration works across environments with different `.env` values.

## 4.3 Expert Track · Enterprise Integrations
### Goal
Design reliable, secure, and observable integrations for production workloads.

#### Architecture & Adapters
- Carve out provider-specific logic under `server/services/integrations/<provider>.ts`.
- Expose an adapter interface that normalizes upstream fields to your internal schema.
- Keep Nitro endpoints thin: validate input, call the adapter, map responses.

#### Webhooks & Callbacks
- Locate webhook handlers under `server/api/webhooks/<provider>.post.ts`.
- Verify signatures with HMAC/public-key checks before processing.
- Persist payload snapshots into an `audit_integrations` table for replay and investigations.

#### Async Processing
- Offload long-running tasks to queues (Redis Streams, RabbitMQ, etc.).
- Initialize clients via a Nitro plugin (`plugins/queue.client.ts`) and reuse across jobs.
- Enforce idempotency (`jobId` hash stored in DB) to guard against duplicate deliveries.

#### Reliability & Resilience
- Wrap outbound calls with retry policies (exponential backoff, jitter) and circuit breakers.
- Provide degraded-mode fallbacks (cached data, feature toggles) when vendors fail.
- Surface upstream SLA breaches in StatusPage or incident tooling.

#### Security Controls
- Restrict egress to whitelisted hosts through network policies.
- Store credentials in a secrets manager (Vault, AWS Secrets Manager) and rotate regularly.
- Apply per-route RBAC in Nitro middleware to limit who can trigger privileged integrations.

#### Observability & Operations
- Emit structured logs with correlation IDs (`integrationId`, `vendorRequestId`).
- Publish metrics (latency, error rate, retry count) to the monitoring stack and configure alerts.
- Add synthetic checks or cron probes to detect silent failures.

#### Documentation & Handover
- Maintain runbooks with on-call contacts, escalation paths, rollback scripts.
- Document sequence diagrams/flow charts (see KRISA guidance) for complex event flows.
- Capture configuration steps (env vars, dashboard URLs) in the Integration wiki.

### Ready when
- Integrations recover from transient vendor issues without manual intervention.
- Security, compliance, and audit standards are met and evidenced.
- New engineers can onboard a vendor by following the documented adapter template.

## 4.4 Quick Reference
- **Key concepts**
  - Plugins register Vue libraries (`plugins/*.client.ts`) and expose components globally.
  - Nitro endpoints proxy external systems (`server/api/`) while hiding secrets.
  - Runtime secrets flow through `nuxt.config.ts` `runtimeConfig`.
  - Integration adapters live in `server/services/integrations/`.
- **Checklist for new integration**
  - [ ] Define business owner, SLA, and escalation contacts.
  - [ ] Document required env vars/defaults and update `.env.example`.
  - [ ] Implement server proxy/webhook with validation + adapter layer.
  - [ ] Add logging, metrics, alerts, and degraded-mode plan.
  - [ ] Update setup docs with configuration + testing instructions.
- **Troubleshooting**
  - *401 from vendor API:* confirm API key/secret, check token expiry, ensure server time sync.
  - *Plugin fails SSR:* rename to `.client.ts` and wrap in `<client-only>`.
  - *Rate limit exceeded:* implement caching/backoff, contact vendor for limit increase.
  - *Webhook replaying:* inspect `audit_integrations`, verify HMAC, enforce idempotency key.
- **Reference materials**
  - `plugins/*.client.ts` — examples of client-side integrations already in project.
  - `server/api/metabase/token.get.ts` — JWT signing proxy pattern.
  - `server/services/integrations/` — adapter templates.
  - Vendor documentation links — store them in `Guidelines/Integration` appendix or project wiki.
