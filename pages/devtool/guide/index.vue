<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import setupMarkdown from "~/guidelines/01-Setup.md?raw";
import frontEndMarkdown from "~/guidelines/02-Front-End.md?raw";
import backendMarkdown from "~/guidelines/03-Backend.md?raw";
import integrationMarkdown from "~/guidelines/04-Integration.md?raw";
import aiMarkdown from "~/guidelines/05-AI-Development-Testing.md?raw";
type GuideSection = {
  title: string;
  goal?: string;
  highlights: string[];
  readyWhen?: string[];
};

type GuideChapter = {
  id: string;
  title: string;
  icon: string;
  summary: string;
  sections: GuideSection[];
  references?: string[];
};

type SummaryPanel = {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: string[];
};

definePageMeta({
  title: "Developer Guide",
  middleware: ["auth"],
  requiresAuth: true,
});

const removeMarkdownFormatting = (input: string): string =>
  input
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\[(?:x|\s)\]\s*/i, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractSection = (source: string, heading: string): string => {
  const pattern = new RegExp(
    `^##\\s*${escapeRegExp(heading)}\\s*\\n([\\s\\S]*?)(?=^##\\s*\\d+\\.|\\Z)`,
    "m"
  );
  const match = source.match(pattern);
  return match?.[1]?.trim() ?? "";
};

const extractSubSection = (section: string, heading: string): string => {
  const pattern = new RegExp(
    `^###\\s*${escapeRegExp(heading)}\\s*\\n([\\s\\S]*?)(?=^###\\s|\\Z)`,
    "m"
  );
  const match = section.match(pattern);
  return match?.[1]?.trim() ?? "";
};

const extractParagraph = (block?: string): string | undefined => {
  if (!block) return undefined;
  const lines = block
    .split(/\r?\n/)
    .map((line) => removeMarkdownFormatting(line).trim())
    .filter(Boolean);
  return lines[0];
};

const parseList = (block?: string): string[] => {
  if (!block) return [];
  const lines = block.split(/\r?\n/);
  const items: string[] = [];
  let inCodeBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock || !line) continue;

    const match = line.match(/^(-|\*|\+|\d+\.)\s+(.*)$/);
    if (match) {
      const cleaned = removeMarkdownFormatting(match[2]);
      if (cleaned) {
        items.push(cleaned);
      }
    }
  }

  return items;
};

type SectionConfig = {
  title: string;
  heading: string;
  goalHeading?: string;
  stepsHeading?: string;
  readyHeading?: string;
};

type SummaryConfig = {
  sectionHeading: string;
  subHeading?: string;
  fallback: string;
};

type ChapterConfig = {
  id: string;
  title: string;
  icon: string;
  source: string;
  summary: SummaryConfig;
  sections: SectionConfig[];
  referencesHeading?: string;
  referencesSubHeading?: string;
  referenceFallback?: string[];
};

const buildGuideSection = (source: string, config: SectionConfig): GuideSection => {
  const sectionRaw = extractSection(source, config.heading);
  const goalBlock = config.goalHeading ? extractSubSection(sectionRaw, config.goalHeading) : undefined;
  const goal = extractParagraph(goalBlock);

  const highlightBlock = config.stepsHeading
    ? extractSubSection(sectionRaw, config.stepsHeading)
    : sectionRaw;
  let highlights = parseList(highlightBlock);

  if (!highlights.length) {
    const fallbackLines = highlightBlock
      .split(/\r?\n/)
      .map((line) => removeMarkdownFormatting(line).trim())
      .filter(Boolean);
    highlights = fallbackLines.slice(0, 5);
  }

  if (!highlights.length) {
    highlights = ["Refer to the guideline section for detailed procedures."];
  }

  const readyBlock = config.readyHeading
    ? extractSubSection(sectionRaw, config.readyHeading)
    : undefined;
  const readyWhen = parseList(readyBlock);

  return {
    title: config.title,
    goal,
    highlights,
    readyWhen: readyWhen.length ? readyWhen : undefined,
  };
};

const buildChapterSummary = (source: string, summary: SummaryConfig): string => {
  const section = extractSection(source, summary.sectionHeading);
  const block = summary.subHeading ? extractSubSection(section, summary.subHeading) : section;
  const paragraph = extractParagraph(block);
  return paragraph ?? summary.fallback;
};

const chapterConfigs: ChapterConfig[] = [
  {
    id: "setup",
    title: "Chapter 1 · Setup",
    icon: "material-symbols:rocket-launch",
    source: setupMarkdown,
    summary: {
      sectionHeading: "1.1 Beginner Track · First-Time Launch",
      subHeading: "Goal",
      fallback: "Get corradAF running locally with a working database and login.",
    },
    sections: [
      {
        title: "Beginner Track · First-Time Launch",
        heading: "1.1 Beginner Track · First-Time Launch",
        goalHeading: "Goal",
        stepsHeading: "Step-by-step",
        readyHeading: "Ready when",
      },
      {
        title: "Intermediate Track · Team-ready Environment",
        heading: "1.2 Intermediate Track · Team-ready Environment",
        goalHeading: "Goal",
        stepsHeading: "Goal", // use goal text as overview plus bullet list that follows
        readyHeading: "Ready when",
      },
      {
        title: "Expert Track · Automation & Deployment",
        heading: "1.3 Expert Track · Automation & Deployment",
        goalHeading: "Goal",
        stepsHeading: "Goal",
        readyHeading: "Ready when",
      },
      {
        title: "Troubleshooting Cheat Sheet",
        heading: "1.4 Troubleshooting Cheat Sheet",
      },
    ],
    referencesHeading: "1.5 Reference Materials",
    referenceFallback: ["guidelines/01-Setup.md"],
  },
  {
    id: "front-end",
    title: "Chapter 2 · Front End",
    icon: "material-symbols:computer",
    source: frontEndMarkdown,
    summary: {
      sectionHeading: "2.1 Beginner Track · Build Your First Page",
      subHeading: "Goal",
      fallback: "Create a working page that appears in the sidebar and matches corradAF styling.",
    },
    sections: [
      {
        title: "Beginner Track · Build Your First Page",
        heading: "2.1 Beginner Track · Build Your First Page",
        goalHeading: "Goal",
        stepsHeading: "Step-by-step",
        readyHeading: "Ready when",
      },
      {
        title: "Intermediate Track · Application Features",
        heading: "2.2 Intermediate Track · Application Features",
        goalHeading: "Goal",
        stepsHeading: "Goal",
        readyHeading: "Ready when",
      },
      {
        title: "Expert Track · Advanced Front-End Patterns",
        heading: "2.3 Expert Track · Advanced Front-End Patterns",
        goalHeading: "Goal",
        stepsHeading: "Goal",
        readyHeading: "Ready when",
      },
      {
        title: "Component Usage Recipes",
        heading: "2.4 Component Usage Recipes",
      },
    ],
    referencesHeading: "2.5 Quick Reference",
    referenceFallback: ["guidelines/02-Front-End.md"],
  },
  {
    id: "backend",
    title: "Chapter 3 · Backend",
    icon: "material-symbols:database",
    source: backendMarkdown,
    summary: {
      sectionHeading: "3.1 Beginner Manual · First API Endpoint",
      subHeading: "Overview",
      fallback: "Publish a Nitro endpoint, return data, and surface it in the UI.",
    },
    sections: [
      {
        title: "Beginner Manual · First API Endpoint",
        heading: "3.1 Beginner Manual · First API Endpoint",
        goalHeading: "Overview",
        stepsHeading: "Procedure",
        readyHeading: "Verification",
      },
      {
        title: "Intermediate Manual · Production-ready APIs",
        heading: "3.2 Intermediate Manual · Production-ready APIs",
        goalHeading: "Overview",
        stepsHeading: "Procedure",
        readyHeading: "Verification",
      },
      {
        title: "Expert Manual · Advanced Backend Engineering",
        heading: "3.3 Expert Manual · Advanced Backend Engineering",
        goalHeading: "Overview",
        stepsHeading: "Procedure",
        readyHeading: "Verification",
      },
      {
        title: "Operations Manual · Quick Reference",
        heading: "3.4 Operations Manual · Quick Reference & Troubleshooting",
      },
    ],
    referencesHeading: "3.4 Operations Manual · Quick Reference & Troubleshooting",
    referencesSubHeading: "Reference Index",
    referenceFallback: ["guidelines/03-Backend.md"],
  },
  {
    id: "integration",
    title: "Chapter 4 · Integration",
    icon: "material-symbols:hub",
    source: integrationMarkdown,
    summary: {
      sectionHeading: "4.1 Beginner Track · Add a Third-party Plugin",
      subHeading: "Goal",
      fallback: "Install a Vue plugin, wire it into Nuxt, and display it on a page.",
    },
    sections: [
      {
        title: "Beginner Track · Add a Third-party Plugin",
        heading: "4.1 Beginner Track · Add a Third-party Plugin",
        goalHeading: "Goal",
        stepsHeading: "Step-by-step",
        readyHeading: "Ready when",
      },
      {
        title: "Intermediate Track · Connecting to External APIs",
        heading: "4.2 Intermediate Track · Connecting to External APIs",
        goalHeading: "Goal",
        readyHeading: "Ready when",
      },
      {
        title: "Expert Track · Enterprise Integrations",
        heading: "4.3 Expert Track · Enterprise Integrations",
        goalHeading: "Goal",
        readyHeading: "Ready when",
      },
      {
        title: "Quick Reference Checklist",
        heading: "4.4 Quick Reference",
      },
    ],
    referencesHeading: "4.4 Quick Reference",
    referencesSubHeading: "Reference materials",
    referenceFallback: ["guidelines/04-Integration.md"],
  },
  {
    id: "ai",
    title: "Chapter 5 · AI-Assisted Development & Testing",
    icon: "material-symbols:smart-toy-outline",
    source: aiMarkdown,
    summary: {
      sectionHeading: "5.1 Beginner Track · Getting Started with AI",
      subHeading: "Goal",
      fallback: "Use AI to accelerate repetitive tasks while staying in control of output.",
    },
    sections: [
      {
        title: "Beginner Track · Getting Started with AI",
        heading: "5.1 Beginner Track · Getting Started with AI",
        goalHeading: "Goal",
        stepsHeading: "Recommended workflow",
        readyHeading: "Ready when",
      },
      {
        title: "Intermediate Track · Pair Programming with AI",
        heading: "5.2 Intermediate Track · Pair Programming with AI",
        goalHeading: "Goal",
        stepsHeading: "Goal",
        readyHeading: "Ready when",
      },
      {
        title: "Expert Track · AI-Driven Workflows & Quality Gates",
        heading: "5.3 Expert Track · AI-Driven Workflows & Quality Gates",
        goalHeading: "Goal",
        stepsHeading: "Goal",
        readyHeading: "Ready when",
      },
      {
        title: "Testing & Prompting Playbooks",
        heading: "5.4 Testing Playbook for AI-Generated Code",
      },
      {
        title: "Prompting Cheat Sheet",
        heading: "5.5 Prompting Cheat Sheet",
      },
      {
        title: "Document Crosscheck Checklist",
        heading: "5.8 Document Crosscheck Checklist for Development",
      },
    ],
    referencesHeading: "5.6 Resources",
    referenceFallback: ["guidelines/05-AI-Development-Testing.md"],
  },
];

const guideChapters: GuideChapter[] = chapterConfigs.map((chapter) => {
  const referencesSection =
    chapter.referencesHeading && extractSection(chapter.source, chapter.referencesHeading);
  const referencesBlock = referencesSection
    ? chapter.referencesSubHeading
      ? extractSubSection(referencesSection, chapter.referencesSubHeading)
      : referencesSection
    : "";
  const referencesList = parseList(referencesBlock);

  return {
    id: chapter.id,
    title: chapter.title,
    icon: chapter.icon,
    summary: buildChapterSummary(chapter.source, chapter.summary),
    sections: chapter.sections.map((sectionConfig) =>
      buildGuideSection(chapter.source, sectionConfig)
    ),
    references:
      referencesList.length
        ? referencesList
        : chapter.referenceFallback && chapter.referenceFallback.length
        ? chapter.referenceFallback
        : undefined,
  };
});

const summaryPanels: SummaryPanel[] = [
  {
    id: "quality",
    title: "Quality Gates & Testing",
    icon: "material-symbols:fact-check",
    description: "Validate AI-assisted and manual changes before merging.",
    items: [
      "Run `yarn lint` (and TypeScript checks where configured) on modified files.",
      "Exercise key user stories manually, including responsive states and edge cases.",
      "Hit Nitro endpoints through `/devtool/api-editor` or Postman to confirm responses.",
      "Inspect database updates with Prisma Studio and ensure migrations contain only intended changes.",
      "Document commands executed, screenshots, and rollback plans for release notes.",
    ],
  },
  {
    id: "documentation",
    title: "Documentation & Handover",
    icon: "material-symbols:library-books",
    description: "Keep artefacts aligned with KRISA and internal standards.",
    items: [
      "Sync requirement tickets, planner templates, and design approvals before implementation.",
      "Update README/Guidelines, API docs, and Prisma notes when behaviour or env vars change.",
      "Capture validation evidence (logs, test outputs, screenshots) for audits.",
      "Apply KRISA headers, version history, and approval flows to formal documents.",
      "Record reviewer sign-offs and archive artefacts in the agreed repository.",
    ],
  },
  {
    id: "ai-mindset",
    title: "AI Prompting Mindset",
    icon: "material-symbols:smart-toy-outline",
    description: "Structure AI collaboration for predictable, reviewable output.",
    items: [
      "Frame requests with Context → Instructions → Output so requirements stay explicit.",
      "Share relevant code snippets plus constraints (Nuxt 3, Tailwind, Prisma, RBAC).",
      "Ask for plans or alternatives first; apply code only after manual review.",
      "Log AI involvement per feature for transparency and future audits.",
      "Build and reuse prompt libraries for recurring flows (CRUD pages, Prisma models, integrations).",
    ],
  },
];

const stickyOffset = 96;
const activeChapter = ref<string>(guideChapters[0]?.id ?? "");
const overviewHighlights = [
  "Track-based guidance for Beginner, Intermediate, and Expert skill levels.",
  "Summaries pulled directly from `/guidelines` so engineers can skim essentials without leaving DevTool.",
  "Use this page as the onboarding launchpad—every section links back to the relevant chapter for deeper study.",
];

const lastUpdated = new Date().toISOString().slice(0, 10);

const chapterRefs = ref<Record<string, HTMLElement | null>>({});
const setChapterRef = (id: string) => (value: Element | ComponentPublicInstance | null) => {
  let el: HTMLElement | null = null;

  if (value instanceof HTMLElement) {
    el = value;
  } else if (value && "$el" in value) {
    const instance = value as ComponentPublicInstance & { $el?: Element | null };
    if (instance.$el instanceof HTMLElement) {
      el = instance.$el;
    }
  }

  if (el) {
    chapterRefs.value[id] = el;
  } else {
    delete chapterRefs.value[id];
  }
};

const scrollToChapter = (id: string) => {
  activeChapter.value = id;
  if (!process.client) return;

  const target = chapterRefs.value[id];
  if (!target) return;

  const { top } = target.getBoundingClientRect();
  const scrollTop = top + window.scrollY - stickyOffset;

  window.scrollTo({
    top: scrollTop,
    behavior: "smooth",
  });
};

let chapterObserver: IntersectionObserver | null = null;

onMounted(() => {
  if (!process.client) return;

  chapterObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      const id = visibleEntry.target.getAttribute("data-chapter-id");
      if (id) {
        activeChapter.value = id;
      }
    },
    {
      rootMargin: "-40% 0px -40% 0px",
      threshold: [0.1, 0.25, 0.5],
    }
  );

  Object.entries(chapterRefs.value).forEach(([id, el]) => {
    if (el) {
      el.dataset.chapterId = id;
      chapterObserver?.observe(el);
    }
  });
});

if (process.client) {
  watch(
    chapterRefs,
    (refs) => {
      if (!chapterObserver) return;

      chapterObserver.disconnect();

      Object.entries(refs).forEach(([id, el]) => {
        if (el) {
          el.dataset.chapterId = id;
          chapterObserver?.observe(el);
        }
      });
    },
    { deep: true }
  );
}

onBeforeUnmount(() => {
  if (!process.client) return;
  chapterObserver?.disconnect();
  chapterObserver = null;
});
</script>

<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-8">
      <LayoutsBreadcrumb />

      <rs-card class="space-y-6 rounded-2xl p-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon name="material-symbols:menu-book-rounded" class="h-6 w-6" />
            </div>
            <div>
              <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">corradAF Developer Guide</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Quick reference distilled from the official guidelines—use it to onboard, plan, and verify your work.
              </p>
            </div>
          </div>
          <rs-badge variant="primary" class="w-fit">
            Updated {{ lastUpdated }}
          </rs-badge>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div
            v-for="highlight in overviewHighlights"
            :key="highlight"
            class="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <Icon name="material-symbols:check-circle-outline" class="mt-0.5 h-4 w-4 text-primary" />
            <span>{{ highlight }}</span>
          </div>
        </div>
      </rs-card>

      <div class="sticky z-20 mb-6" :style="{ top: `${stickyOffset}px` }">
        <div class="overflow-x-auto pb-2">
          <div class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/80 p-2 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/60">
            <button
              v-for="chapter in guideChapters"
              :key="chapter.id"
              type="button"
              @click="scrollToChapter(chapter.id)"
              :aria-pressed="activeChapter === chapter.id"
              :class="[
                'flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                activeChapter === chapter.id
                  ? 'border-primary bg-primary text-white shadow-md'
                  : 'border-transparent bg-white/70 text-gray-600 hover:border-primary hover:bg-primary/10 hover:text-primary dark:bg-gray-900/40 dark:text-gray-300'
              ]"
            >
              <Icon :name="chapter.icon" class="h-4 w-4" />
              <span>{{ chapter.title }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-8">
        <section
          v-for="chapter in guideChapters"
          :key="chapter.id"
          :ref="setChapterRef(chapter.id)"
          :data-chapter-id="chapter.id"
          class="scroll-mt-28"
          :style="{ scrollMarginTop: `${stickyOffset + 24}px` }"
        >
          <rs-card class="space-y-8 rounded-2xl p-8">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div class="flex items-start gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon :name="chapter.icon" class="h-6 w-6" />
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ chapter.title }}</h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ chapter.summary }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:gap-6 lg:pb-4">
              <div
                v-for="section in chapter.sections"
                :key="section.title"
                class="flex w-full min-w-[320px] max-w-md flex-col gap-4 rounded-xl border border-gray-100 bg-white/70 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80 lg:min-w-[360px]"
              >
                <div class="space-y-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ section.title }}</h3>
                  <p v-if="section.goal" class="text-sm text-gray-600 dark:text-gray-400">
                    {{ section.goal }}
                  </p>
                </div>

                <ul class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <li
                    v-for="point in section.highlights"
                    :key="point"
                    class="flex items-start gap-3"
                  >
                    <Icon name="material-symbols:fiber-manual-record" class="h-5 w-5 text-primary" />
                    <span class="flex-1 break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {{ point }}
                    </span>
                  </li>
                </ul>

                <div
                  v-if="section.readyWhen?.length"
                  class="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-primary-900 dark:border-primary/40 dark:bg-primary/10 dark:text-primary-100"
                >
                  <p class="mb-2 text-xs font-semibold uppercase tracking-wide">Ready when</p>
                  <ul class="space-y-2">
                    <li
                      v-for="ready in section.readyWhen"
                      :key="ready"
                      class="flex items-start gap-2"
                    >
                      <Icon name="material-symbols:flag" class="mt-0.5 h-4 w-4" />
                      <span class="flex-1 break-words text-sm leading-relaxed text-primary-900 dark:text-primary-100">
                        {{ ready }}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div
              v-if="chapter.references?.length"
              class="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/50"
            >
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Key references
              </p>
              <ul class="space-y-2 text-gray-700 dark:text-gray-300">
                <li
                  v-for="reference in chapter.references"
                  :key="reference"
                  class="flex items-start gap-2"
                >
                  <Icon name="material-symbols:bookmark-outline" class="mt-0.5 h-4 w-4 text-primary" />
                  <span class="flex-1 break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {{ reference }}
                  </span>
                </li>
              </ul>
            </div>
          </rs-card>
        </section>
      </div>

      <div class="flex flex-col gap-6 lg:flex-row lg:flex-wrap">
        <rs-card
          v-for="panel in summaryPanels"
          :key="panel.id"
          class="flex flex-1 flex-col gap-4 rounded-2xl p-6"
        >
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon :name="panel.icon" class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ panel.title }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ panel.description }}
              </p>
            </div>
          </div>
          <ul class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li
              v-for="item in panel.items"
              :key="item"
              class="flex items-start gap-3"
            >
              <Icon name="material-symbols:check-circle" class="mt-0.5 h-4 w-4 text-primary" />
              <span class="flex-1 break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {{ item }}
              </span>
            </li>
          </ul>
        </rs-card>
      </div>
    </div>
  </div>
</template>

