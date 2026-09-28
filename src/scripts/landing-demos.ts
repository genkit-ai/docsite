/**
 * Progressive enhancement for the landing page demos.
 *
 * Everything here is optional: without JavaScript, all content is visible,
 * TypeScript is shown by default, and each demo renders in its final state.
 */
import type { UnifiedPageManager } from './unified-page-manager';

const LANGUAGES = ['js', 'go', 'python', 'dart'];

/** Shows the panes, tabs, and inline labels for one SDK language. */
function applyLanguage(lang: string) {
  if (!LANGUAGES.includes(lang)) return;

  document.querySelectorAll<HTMLElement>('[data-lang-tab]').forEach((tab) => {
    const selected = tab.dataset.langTab === lang;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll<HTMLElement>('[data-lang-pane]').forEach((pane) => {
    pane.hidden = pane.dataset.langPane !== lang;
  });
  document.querySelectorAll<HTMLElement>('[data-lang-only]').forEach((element) => {
    element.hidden = !(element.dataset.langOnly ?? '').split(/\s+/).includes(lang);
  });

  // Picking a language leaves the agent skills view of the install widget.
  document.querySelectorAll<HTMLElement>('[data-install][data-view]').forEach((widget) => {
    widget.removeAttribute('data-view');
  });
  document.querySelectorAll<HTMLElement>('[data-install] [data-skills-view]').forEach((el) => {
    el.hidden = true;
  });
  document.querySelectorAll<HTMLElement>('[data-skills-tab]').forEach((tab) => {
    tab.setAttribute('aria-selected', 'false');
    tab.tabIndex = -1;
  });
}

/**
 * Selects a language site-wide. The page manager persists the choice (so the
 * docs open in the same language) and broadcasts `genkit:languagechange`.
 */
function selectLanguage(lang: string) {
  const manager: UnifiedPageManager | undefined = window.unifiedPageManager;
  if (manager) {
    manager.setLanguage(lang, true);
  } else {
    applyLanguage(lang);
  }
}

/**
 * Shows the agent skills command in one install widget. Agent skills work
 * with every SDK, so the site-wide language stays as it is.
 */
function showSkills(widget: HTMLElement) {
  widget.dataset.view = 'skills';
  widget.querySelectorAll<HTMLElement>('[data-skills-view]').forEach((el) => {
    el.hidden = false;
  });
  widget.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => {
    const selected = tab.hasAttribute('data-skills-tab');
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
}

function initLanguageTabs(signal: AbortSignal) {
  document.querySelectorAll<HTMLElement>('[data-lang-tablist]').forEach((tablist) => {
    const tabs = Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]'));
    const widget = tablist.closest<HTMLElement>('[data-install]');

    const activate = (tab: HTMLElement) => {
      if (tab.hasAttribute('data-skills-tab')) {
        if (widget) showSkills(widget);
      } else {
        selectLanguage(tab.dataset.langTab ?? 'js');
      }
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab), { signal });
      tab.addEventListener(
        'keydown',
        (event) => {
          const keys: Record<string, number> = {
            ArrowRight: (index + 1) % tabs.length,
            ArrowLeft: (index - 1 + tabs.length) % tabs.length,
            Home: 0,
            End: tabs.length - 1,
          };
          if (!(event.key in keys)) return;
          event.preventDefault();
          const next = tabs[keys[event.key]];
          next.focus();
          activate(next);
        },
        { signal },
      );
    });
  });

  document.addEventListener(
    'genkit:languagechange',
    (event) => {
      const lang = (event as CustomEvent<{ language?: string }>).detail?.language;
      if (lang) applyLanguage(lang);
    },
    { signal },
  );

  // The page manager may have already announced the stored language.
  applyLanguage(document.documentElement.getAttribute('data-genkit-lang') ?? 'js');
}

function playDemo(demo: HTMLElement) {
  demo.setAttribute('data-played', '');
}

function replayDemo(demo: HTMLElement) {
  demo.removeAttribute('data-played');
  // Force a reflow so the CSS animations restart from the beginning.
  void demo.offsetWidth;
  playDemo(demo);
}

/** Used when a scene doesn't say how long it lasts. */
const DEFAULT_SCENE_MS = 6500;
/** How much of the stage must be on screen before the tour runs. */
const SHOWCASE_VISIBLE_RATIO = 0.4;

/**
 * "What will you build?": a tour that shows one scene after another while the
 * stage is on screen. Pointing at the stage or focusing inside it holds the
 * current scene. Choosing a tab, or the pause button, ends the tour.
 */
function initShowcase(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-showcase]');
  const stage = root?.querySelector<HTMLElement>('[data-showcase-stage]');
  if (!root || !stage) return;

  const tabs = Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]'));
  const panels = tabs
    .map((tab) => document.getElementById(tab.getAttribute('aria-controls') ?? ''))
    .filter((panel): panel is HTMLElement => panel !== null);
  if (tabs.length === 0 || panels.length !== tabs.length) return;

  const toggle = root.querySelector<HTMLButtonElement>('[data-showcase-toggle]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canTour = !reduceMotion && 'IntersectionObserver' in window;

  let index = Math.max(0, panels.findIndex((panel) => panel.hasAttribute('data-active')));
  let touring = false;
  let started = false;
  let inView = false;
  let pointing = false;
  let focused = false;
  let timer: number | undefined;
  let remaining = DEFAULT_SCENE_MS;
  let countdownStart = 0;

  /** Counts down to the next scene only while someone can watch it. */
  const sync = () => {
    const running = touring && inView && !pointing && !focused && !document.hidden;
    root.toggleAttribute('data-held', !running);
    if (running && timer === undefined) {
      countdownStart = performance.now();
      timer = window.setTimeout(() => {
        timer = undefined;
        show((index + 1) % tabs.length);
      }, remaining);
    } else if (!running && timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
      remaining = Math.max(0, remaining - (performance.now() - countdownStart));
    }
  };

  const show = (next: number) => {
    window.clearTimeout(timer);
    timer = undefined;
    index = next;
    started = true;

    const panel = panels[next];
    remaining = Number(panel.dataset.duration) || DEFAULT_SCENE_MS;
    root.style.setProperty('--scene-ms', `${remaining}ms`);

    tabs.forEach((tab, i) => {
      const selected = i === next;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((other, i) => other.toggleAttribute('data-active', i === next));

    const demo = panel.querySelector<HTMLElement>('.gk-demo');
    if (demo) replayDemo(demo);

    // Start the tab's progress bar from empty, even if it was already selected.
    const fill = tabs[next].querySelector<HTMLElement>('[data-fill]');
    if (fill) {
      fill.style.animation = 'none';
      void fill.offsetWidth;
      fill.style.removeProperty('animation');
    }

    sync();
  };

  const setTouring = (on: boolean) => {
    touring = on;
    root.toggleAttribute('data-autoplay', on);
    if (toggle) {
      toggle.toggleAttribute('data-paused', !on);
      toggle.setAttribute('aria-label', on ? 'Pause the tour' : 'Play the tour');
    }
  };

  /** A choice by the reader ends the tour. */
  const choose = (next: number) => {
    setTouring(false);
    show(next);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => choose(i), { signal });
    tab.addEventListener(
      'keydown',
      (event) => {
        const keys: Record<string, number> = {
          ArrowRight: (i + 1) % tabs.length,
          ArrowLeft: (i - 1 + tabs.length) % tabs.length,
          Home: 0,
          End: tabs.length - 1,
        };
        if (!(event.key in keys)) return;
        event.preventDefault();
        tabs[keys[event.key]].focus();
        choose(keys[event.key]);
      },
      { signal },
    );
  });

  if (!canTour) {
    // Every scene shows its final state, and the tabs still switch scenes.
    panels.forEach((panel) => {
      const demo = panel.querySelector<HTMLElement>('.gk-demo');
      if (demo) playDemo(demo);
    });
    return;
  }

  setTouring(true);
  root.setAttribute('data-held', '');

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener(
      'click',
      () => {
        if (touring) {
          setTouring(false);
          sync();
        } else {
          setTouring(true);
          show(index);
        }
      },
      { signal },
    );
  }

  stage.addEventListener(
    'pointerenter',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      pointing = true;
      sync();
    },
    { signal },
  );
  stage.addEventListener(
    'pointerleave',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      pointing = false;
      sync();
    },
    { signal },
  );
  stage.addEventListener(
    'focusin',
    () => {
      focused = true;
      sync();
    },
    { signal },
  );
  stage.addEventListener(
    'focusout',
    (event) => {
      if (stage.contains(event.relatedTarget as Node | null)) return;
      focused = false;
      sync();
    },
    { signal },
  );

  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= SHOWCASE_VISIBLE_RATIO;
      // The first scene plays the first time the stage comes into view.
      if (inView && !started) show(index);
      else sync();
    },
    { threshold: SHOWCASE_VISIBLE_RATIO },
  );
  observer.observe(stage);

  document.addEventListener('visibilitychange', sync, { signal });
  signal.addEventListener('abort', () => {
    observer.disconnect();
    window.clearTimeout(timer);
    timer = undefined;
  });
}

function initCopyButtons(signal: AbortSignal) {
  document.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach((button) => {
    const label = button.querySelector<HTMLElement>('[data-copy-label]');
    let resetTimer: number | undefined;

    button.addEventListener(
      'click',
      async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy ?? '');
          if (label) label.textContent = 'Copied!';
          button.dataset.state = 'copied';
        } catch {
          // Clipboard access can be blocked. Select the command so it is easy to copy by hand.
          const code = button.parentElement?.querySelector('code');
          if (code) window.getSelection()?.selectAllChildren(code);
          if (label) label.textContent = 'Selected';
          button.dataset.state = 'selected';
        }
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          if (label) label.textContent = 'Copy';
          delete button.dataset.state;
        }, 1600);
      },
      { signal },
    );

    signal.addEventListener('abort', () => {
      window.clearTimeout(resetTimer);
    });
  });
}

/** The first time the model switcher is in view, it steps through each model once. */
const MODEL_TOUR_DELAY_MS = 600;
const MODEL_TOUR_STEP_MS = 1100;

function initModelSwitchers(signal: AbortSignal) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll<HTMLElement>('[data-model-switcher]').forEach((switcher) => {
    const buttons = Array.from(switcher.querySelectorAll<HTMLButtonElement>('[data-model-btn]'));
    const variants = Array.from(switcher.querySelectorAll<HTMLElement>('[data-model-line]'));
    const highlightedLine = switcher.querySelector<HTMLElement>('.line.is-hl');
    const tourTimers: number[] = [];

    const select = (button: HTMLButtonElement) => {
      const model = button.dataset.modelBtn;
      buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      variants.forEach((variant) => {
        variant.hidden = variant.dataset.modelLine !== model;
      });
      if (highlightedLine) {
        highlightedLine.removeAttribute('data-flash');
        void highlightedLine.offsetWidth;
        highlightedLine.setAttribute('data-flash', '');
      }
    };

    buttons.forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          // A choice by the reader ends the tour.
          tourTimers.splice(0).forEach((timer) => window.clearTimeout(timer));
          select(button);
        },
        { signal },
      );
    });

    if (reduceMotion || !('IntersectionObserver' in window) || buttons.length < 2) return;

    // Every other model, then back to the first. Finishes in under 5 seconds.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        [...buttons.slice(1), buttons[0]].forEach((button, index) => {
          tourTimers.push(window.setTimeout(() => select(button), MODEL_TOUR_DELAY_MS + index * MODEL_TOUR_STEP_MS));
        });
      },
      { threshold: 0.6 },
    );
    observer.observe(switcher);

    signal.addEventListener('abort', () => {
      observer.disconnect();
      tourTimers.splice(0).forEach((timer) => window.clearTimeout(timer));
    });
  });
}

/**
 * The hero demo: a short story in steps, looped while the hero is visible.
 * 0 reset, 1 typing, 2 sent, 3 searching (tool call), 4 GenUI flight cards,
 * 5 tap on "Select", 6 booking (tool call), 7 the card updates in place to a
 * booking pass.
 */
const HERO_TIMELINE: Array<[step: number, atMs: number]> = [
  [0, 0],
  [1, 400],
  [2, 1500],
  [3, 2100],
  [4, 3500],
  [5, 5800],
  [6, 6300],
  [7, 7600],
];
const HERO_LOOP_MS = 11800;
const HERO_STATIC_STEP = '4';

function initHeroDemo(signal: AbortSignal) {
  const demo = document.getElementById('hero-demo');
  if (!demo) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    demo.dataset.step = HERO_STATIC_STEP;
    demo.setAttribute('data-live', '');
    return;
  }

  let timers: number[] = [];
  let running = false;
  let inView = false;
  let paused = false;

  /** Plays the rest of the loop from `fromStep`, then starts over. */
  const play = (fromStep = 0) => {
    // Every timer from the previous loop has fired or been cleared by now.
    timers = [];
    const offset = HERO_TIMELINE.find(([step]) => step === fromStep)?.[1] ?? 0;
    HERO_TIMELINE.forEach(([step, atMs]) => {
      if (step < fromStep) return;
      timers.push(window.setTimeout(() => (demo.dataset.step = String(step)), atMs - offset));
    });
    timers.push(window.setTimeout(() => play(), HERO_LOOP_MS - offset));
  };

  const start = (fromStep = 0) => {
    if (running || paused) return;
    running = true;
    play(fromStep);
  };

  const stop = () => {
    running = false;
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
  };

  demo.dataset.step = '0';
  demo.setAttribute('data-live', '');

  const toggle = document.getElementById('hero-demo-toggle');
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener(
      'click',
      () => {
        paused = !paused;
        demo.toggleAttribute('data-paused', paused);
        toggle.toggleAttribute('data-paused', paused);
        toggle.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
        if (paused) stop();
        else if (inView && !document.hidden) start(Number(demo.dataset.step) || 0);
      },
      { signal },
    );
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !document.hidden) start();
      else stop();
    },
    { threshold: 0.25 },
  );
  observer.observe(demo);

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) stop();
      else if (inView) start();
    },
    { signal },
  );

  signal.addEventListener('abort', () => {
    observer.disconnect();
    stop();
  });
}

let pageController: AbortController | undefined;

function initLandingDemos() {
  pageController?.abort();
  pageController = new AbortController();
  const { signal } = pageController;

  initLanguageTabs(signal);
  initHeroDemo(signal);
  initShowcase(signal);
  initCopyButtons(signal);
  initModelSwitchers(signal);
}

document.addEventListener('astro:page-load', initLandingDemos);
initLandingDemos();
