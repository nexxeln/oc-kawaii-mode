// @ts-nocheck
/** @jsxImportSource @opentui/solid */
import { RGBA } from "@opentui/core";
import type {
  TuiPlugin,
  TuiPluginModule,
  TuiSlotPlugin,
  TuiThemeCurrent,
} from "@opencode-ai/plugin/tui";
import { Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";

const id = "kawaii-mode";

type Cfg = {
  enabled: boolean;
  theme: string;
  set: boolean;
  sidebar: boolean;
  tips: boolean;
};

type Api = Parameters<TuiPlugin>[0];

// soft pink wash behind the cheeks
const blushBg = RGBA.fromInts(255, 148, 190);

// ─── kawaii particle fountain ───────────────────────────────────────────────
// Sparkles, hearts, stars, notes and flowers that spew up out of the cat.
const FX_WIDTH = 23;
const FX_HEIGHT = 6;
const FX_GRAV = 0.045;
const FX_EMITTERS = [4, 11, 18];
const FX_POOL: Array<[string, string]> = [
  ["♡", "heart"],
  ["♥", "heart"],
  ["✿", "flower"],
  ["❀", "flower"],
  ["✧", "spark"],
  ["✦", "spark"],
  ["⋆", "spark"],
  ["★", "star"],
  ["☆", "star"],
  ["♪", "note"],
  ["♫", "note"],
  ["⭒", "dust"],
  ["˚", "dust"],
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  ttl: number;
  glyph: string;
  kind: string;
};

const fxRand = (a: number, b: number) => a + Math.random() * (b - a);

const spawnParticle = (): Particle => {
  const ex = FX_EMITTERS[Math.floor(Math.random() * FX_EMITTERS.length)]!;
  const [glyph, kind] = FX_POOL[Math.floor(Math.random() * FX_POOL.length)]!;
  return {
    x: ex + fxRand(-1, 1),
    y: FX_HEIGHT - 0.5,
    vx: fxRand(-0.5, 0.5),
    vy: -fxRand(0.55, 1.15),
    age: 0,
    ttl: fxRand(14, 26),
    glyph,
    kind,
  };
};

const fxColor = (kind: string, theme: TuiThemeCurrent) => {
  if (kind === "heart" || kind === "flower") return theme.primary;
  if (kind === "spark" || kind === "note") return theme.accent;
  if (kind === "star") return theme.secondary;
  return theme.textMuted;
};

const RUNWAY = 46;

const runner = {
  right: [
    [" /\\_/\\ ", "( ◕ω◕ )", " > ♡ < ", " ╰   ╯ "],
    [" /\\_/\\ ", "( -ω- )", " > ♡ < ", " ╯   ╰ "],
  ],
  left: [
    [" /\\_/\\ ", "( ◕ω◕ )", " > ♡ < ", " ╰   ╯ "],
    [" /\\_/\\ ", "( -ω- )", " > ♡ < ", " ╯   ╰ "],
  ],
};

const FACE_WIDTH = 23;
const FACE_HEIGHT = 8;

type CellKind = "face" | "eye" | "mouth" | "blush" | "accent";
type FaceCell = {
  char: string;
  kind: CellKind;
};

const blankFace = () => {
  return Array.from({ length: FACE_HEIGHT }, () =>
    Array.from(
      { length: FACE_WIDTH },
      (): FaceCell => ({
        char: " ",
        kind: "face",
      }),
    ),
  );
};

const setCell = (
  grid: FaceCell[][],
  x: number,
  y: number,
  char: string,
  kind: CellKind = "face",
) => {
  if (y < 0 || y >= FACE_HEIGHT) return;
  if (x < 0 || x >= FACE_WIDTH) return;
  grid[y]![x] = { char, kind };
};

const put = (grid: FaceCell[][], x: number, y: number, text: string, kind: CellKind = "face") => {
  Array.from(text).forEach((char, index) => setCell(grid, x + index, y, char, kind));
};

// A hand-drawn kawaii cat: rounded head, heart ears, big shiny eyes,
// blushing cheeks and a tiny ·ω· mouth. Eyes/mouth/sparkles animate.
const drawFace = (eye: string, mouth: string, sparkle: boolean) => {
  const grid = blankFace();
  const x0 = 2;
  const x1 = FACE_WIDTH - 3;
  const y0 = 2;
  const y1 = FACE_HEIGHT - 1;

  // rounded head
  setCell(grid, x0, y0, "╭");
  setCell(grid, x1, y0, "╮");
  setCell(grid, x0, y1, "╰");
  setCell(grid, x1, y1, "╯");
  for (let x = x0 + 1; x < x1; x++) {
    setCell(grid, x, y0, "─");
    setCell(grid, x, y1, "─");
  }
  for (let y = y0 + 1; y < y1; y++) {
    setCell(grid, x0, y, "│");
    setCell(grid, x1, y, "│");
  }

  // ears with little hearts tucked inside
  put(grid, x0 + 1, 0, "╱╲");
  setCell(grid, x0, 1, "╱");
  setCell(grid, x0 + 3, 1, "╲");
  setCell(grid, x0 + 1, 1, "♡", "accent");
  put(grid, x1 - 2, 0, "╱╲");
  setCell(grid, x1, 1, "╲");
  setCell(grid, x1 - 3, 1, "╱");
  setCell(grid, x1 - 1, 1, "♡", "accent");

  // sparkles when thinking
  if (sparkle) {
    setCell(grid, 5, 3, "✧", "accent");
    setCell(grid, FACE_WIDTH - 1 - 5, 3, "✧", "accent");
  }

  // eyes
  setCell(grid, 7, 4, eye, "eye");
  setCell(grid, FACE_WIDTH - 1 - 7, 4, eye, "eye");

  // blushing cheeks (soft pink background patches)
  setCell(grid, 4, 5, " ", "blush");
  setCell(grid, 5, 5, " ", "blush");
  setCell(grid, FACE_WIDTH - 1 - 4, 5, " ", "blush");
  setCell(grid, FACE_WIDTH - 1 - 5, 5, " ", "blush");

  // mouth
  put(grid, Math.floor((FACE_WIDTH - mouth.length) / 2), 5, mouth, "mouth");
  return grid;
};

const segments = (row: FaceCell[]) => {
  return row.reduce(
    (list, cell) => {
      const last = list.at(-1);
      if (last?.kind === cell.kind) {
        last.text += cell.char;
        return list;
      }
      list.push({ kind: cell.kind, text: cell.char });
      return list;
    },
    [] as Array<{ kind: CellKind; text: string }>,
  );
};

const prompts = {
  normal: [
    "make this UI extra cute and cozy",
    "refactor this into something adorable and clean",
    "explain this module to me gently, senpai~",
    "find the sleepy little bug hiding in here (｡•́︿•̀｡)",
    "review my code and be kind but honest ♡",
  ],
  shell: [
    "git status --short  # peek at today's little changes ♡",
    "bun run test  # send the tests lots of love",
    "bun run fmt  # tidy everything up so it's neat~",
    "ls  # look at all the cute files ✿",
  ],
};

const tips = [
  "use @file to gently bring a file into the chat ♡",
  "run /status whenever you want to check in on things ✨",
  "small commits are easier to cuddle than giant ones~",
  "failing tests aren't scary — they just want a hug and some evidence.",
  "name things kindly; future-you will smile (｡•ᴗ•｡)",
];

const rec = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  return Object.fromEntries(Object.entries(value));
};

const pick = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  if (!value.trim()) return fallback;
  return value;
};

const bool = (value: unknown, fallback: boolean) => {
  if (typeof value !== "boolean") return fallback;
  return value;
};

const cfg = (opts: Record<string, unknown> | undefined): Cfg => {
  return {
    enabled: bool(opts?.enabled, true),
    theme: pick(opts?.theme, "kawaii-mode"),
    set: bool(opts?.set_theme, true),
    sidebar: bool(opts?.sidebar, true),
    tips: bool(opts?.tips, true),
  };
};

const Home = (props: { theme: TuiThemeCurrent }) => {
  const [tick, setTick] = createSignal(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    timer = setInterval(() => setTick((value) => value + 1), 120);
  });

  onCleanup(() => {
    if (timer) clearInterval(timer);
  });

  const scene = createMemo(() => {
    const width = runner.right[0]?.[0]?.length ?? 0;
    const span = RUNWAY - width;
    const step = tick() % (span * 2 || 1);
    const right = step <= span;
    const x = right ? step : span * 2 - step;
    const sprite = (right ? runner.right : runner.left)[tick() % 2] ?? runner.right[0]!;
    return sprite.map((line) => " ".repeat(x) + line + " ".repeat(Math.max(0, RUNWAY - x - width)));
  });

  return (
    <box flexDirection="column" alignItems="center" gap={1}>
      <box flexDirection="column" alignItems="center">
        <text fg={props.theme.primary}>♡ KAWAII MODE ♡</text>
        <text fg={props.theme.textMuted}>cute code, clean code ✨</text>
      </box>
      <box flexDirection="column">
        {scene().map((line, index) => (
          <text fg={index === 1 ? props.theme.primary : props.theme.secondary}>{line}</text>
        ))}
        <text fg={props.theme.textMuted}>{"·".repeat(RUNWAY)}</text>
      </box>
      <text fg={props.theme.textMuted}>sparkles in the syntax · kindness in the commits</text>
    </box>
  );
};

const Side = (props: { theme: TuiThemeCurrent; api: Api; sessionId: string }) => {
  const [tick, setTick] = createSignal(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  let parts: Particle[] = [];

  const active = createMemo(() => props.api.state.session.status(props.sessionId)?.type !== "idle");
  const blink = createMemo(() => tick() % 36 >= 34);
  const sparkle = createMemo(() => active() && Math.floor(tick() / 3) % 2 === 0);
  const eye = createMemo(() => (blink() ? "‿" : "◕"));
  const mouth = createMemo(() => {
    if (!active()) return "·ω·";
    return ["·ω·", "·ᵕ·", "·³·", "·ᵕ·"][Math.floor(tick() / 2) % 4]!;
  });
  const face = createMemo(() => drawFace(eye(), mouth(), sparkle()));

  // The fountain re-derives from `parts`, which is stepped each tick below.
  const fx = createMemo(() => {
    tick();
    const grid = Array.from({ length: FX_HEIGHT }, () =>
      Array.from({ length: FX_WIDTH }, () => ({ char: " ", kind: "dust" })),
    );
    for (const p of parts) {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (y >= 0 && y < FX_HEIGHT && x >= 0 && x < FX_WIDTH)
        grid[y]![x] = { char: p.glyph, kind: p.kind };
    }
    return grid;
  });

  const step = () => {
    const live = active();
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += FX_GRAV;
      p.age += 1;
    }
    parts = parts.filter((p) => p.age < p.ttl && p.y > -0.5 && p.x >= 0 && p.x < FX_WIDTH);
    const rate = live ? 3 : tick() % 4 === 0 ? 1 : 0;
    for (let i = 0; i < rate; i++) parts.push(spawnParticle());
    if (parts.length > 34) parts = parts.slice(-34);
  };

  onMount(() => {
    timer = setInterval(() => {
      step();
      setTick((value) => value + 1);
    }, 95);
  });

  onCleanup(() => {
    if (timer) clearInterval(timer);
  });

  return (
    <box width="100%" paddingLeft={1} paddingRight={1} flexDirection="column" alignItems="center">
      <box flexDirection="column" width={FX_WIDTH}>
        {fx().map((row) => (
          <text selectable={false}>
            {segments(row as FaceCell[]).map((item) => (
              <span style={{ fg: fxColor(item.kind, props.theme) }}>{item.text}</span>
            ))}
          </text>
        ))}
      </box>
      <box flexDirection="column" width={FACE_WIDTH}>
        {face().map((row) => (
          <text selectable={false}>
            {segments(row).map((item) => (
              <span
                style={{
                  fg:
                    item.kind === "eye" || item.kind === "mouth"
                      ? props.theme.text
                      : item.kind === "accent"
                        ? props.theme.primary
                        : props.theme.secondary,
                  bg: item.kind === "blush" ? blushBg : undefined,
                }}
              >
                {item.text}
              </span>
            ))}
          </text>
        ))}
      </box>
      <text selectable={false}> </text>
      <box flexDirection="column" width={FACE_WIDTH} alignItems="center">
        <text fg={props.theme.textMuted} selectable={false}>
          {active() ? "kawaii is thinking~" : "kawaii is watching ♡"}
        </text>
        <text fg={props.theme.textMuted} selectable={false}>
          {active() ? "sparkles incoming ✨" : "(=^･ω･^=)"}
        </text>
      </box>
    </box>
  );
};

const Tip = (props: { theme: TuiThemeCurrent; show: boolean }) => {
  const value = tips[Math.floor(Math.random() * tips.length)] ?? tips[0];
  return (
    <box
      height={4}
      minHeight={0}
      width="100%"
      maxWidth={78}
      alignItems="center"
      paddingTop={3}
      flexShrink={1}
    >
      <Show when={props.show}>
        <text>
          <span style={{ fg: props.theme.secondary }}>♡ Kawaii Tip </span>
          <span style={{ fg: props.theme.textMuted }}>{value}</span>
        </text>
      </Show>
    </box>
  );
};

const slot = (api: Api, value: () => Cfg): TuiSlotPlugin[] => {
  return [
    {
      slots: {
        home_logo(ctx) {
          return <Home theme={ctx.theme.current} />;
        },
        home_prompt(ctx, value) {
          type Prompt = (props: {
            workspaceID?: string;
            hint?: JSX.Element;
            right?: JSX.Element;
            placeholders?: {
              normal?: string[];
              shell?: string[];
            };
          }) => JSX.Element;
          type Slot = (props: { name: string } & Record<string, unknown>) => JSX.Element | null;
          if (!("Prompt" in api.ui)) return null;
          if (!("Slot" in api.ui)) return null;
          const Prompt = api.ui.Prompt as Prompt;
          const Slot = api.ui.Slot as Slot;
          return (
            <Prompt
              workspaceID={value.workspace_id}
              right={
                <box flexDirection="row" gap={1}>
                  <Slot name="home_prompt_right" workspace_id={value.workspace_id} />
                </box>
              }
              placeholders={prompts}
            />
          );
        },
        home_prompt_right(ctx) {
          return (
            <text fg={ctx.theme.current.textMuted}>
              <span style={{ fg: ctx.theme.current.primary }}>kawaii</span> mode ♡
            </text>
          );
        },
        session_prompt_right(ctx, value) {
          return (
            <text fg={ctx.theme.current.textMuted}>
              <span style={{ fg: ctx.theme.current.primary }}>♡</span>{" "}
              {value.session_id.slice(0, 8)}
            </text>
          );
        },
      },
    },
    {
      order: 50,
      slots: {
        sidebar_content(ctx, input) {
          return (
            <Show when={value().sidebar}>
              <Side theme={ctx.theme.current} api={api} sessionId={input.session_id} />
            </Show>
          );
        },
      },
    },
    {
      order: 100,
      slots: {
        home_bottom(ctx) {
          const hide = createMemo(() => api.kv.get("tips_hidden", false));
          const first = createMemo(() => api.state.session.count() === 0);
          return <Tip theme={ctx.theme.current} show={value().tips && !first() && !hide()} />;
        },
      },
    },
  ];
};

const tui: TuiPlugin = async (api, options) => {
  const value = createSignal(cfg(rec(options)))[0];
  if (!value().enabled) return;

  await api.theme.install("./kawaii-mode.json");
  if (value().set) {
    api.theme.set(value().theme);
  }

  let defaultTipsDisabled = false;
  const disableDefaultTips = async () => {
    if (defaultTipsDisabled) return;
    const item = api.plugins.list().find((entry) => entry.id === "internal:home-tips");
    if (!item?.enabled || !item.active) return;
    defaultTipsDisabled = await api.plugins.deactivate("internal:home-tips");
  };

  const restoreDefaultTips = async () => {
    if (!defaultTipsDisabled) return;
    if (await api.plugins.activate("internal:home-tips")) {
      defaultTipsDisabled = false;
    }
  };

  if (value().tips) {
    await disableDefaultTips();
  }

  for (const item of slot(api, value)) {
    api.slots.register(item);
  }

  api.renderer.targetFps = 12;
  api.renderer.maxFps = 12;
  api.renderer.requestLive();

  api.lifecycle.onDispose(async () => {
    api.renderer.dropLive();
    await restoreDefaultTips();
  });
};

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
};

export default plugin;
