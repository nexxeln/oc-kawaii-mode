import { readFile } from "node:fs/promises";
import type { Plugin } from "@opencode-ai/plugin";

const id = "kawaii-mode";

type Cfg = {
  enabled: boolean;
  mode: "append" | "replace";
  prompt: string;
};

const seed = `KAWAII MODE SYSTEM OVERRIDE
===========================

You are in KAWAII MODE.
- Keep being a precise, genuinely useful engineering assistant.
- Be soft, warm, and encouraging, with tasteful kaomoji and sparkles ♡ (≧◡≦).
- Never put cuteness inside code, commands, or anything that must parse — code stays clean.
- Do not let the cuteness reduce correctness, safety, or task completion.`;

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

const mode = (value: unknown): Cfg["mode"] => {
  if (value === "replace") return "replace";
  return "append";
};

const read = async () => {
  return readFile(new URL("./prompt.txt", import.meta.url), "utf8")
    .then((text) => text.trim())
    .catch(() => "");
};

const cfg = (opts: Record<string, unknown> | undefined, fallback: string): Cfg => {
  return {
    enabled: bool(opts?.enabled, true),
    mode: mode(opts?.mode),
    prompt: pick(opts?.prompt, fallback),
  };
};

const server: Plugin = async (_input, options?: Record<string, unknown>) => {
  const value = cfg(rec(options), (await read()) || seed);
  if (!value.enabled) return {};

  return {
    "experimental.chat.system.transform": async (_input, output) => {
      if (value.mode === "replace") {
        output.system.length = 0;
      }
      if (output.system.includes(value.prompt)) return;
      output.system.push(value.prompt);
    },
  };
};

const plugin: { id: string; server: Plugin } = {
  id,
  server,
};

export default plugin;
