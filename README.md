# Kawaii Mode plugin for OpenCode

A tiny OpenCode plugin that turns your assistant **extremely kawaii** (｡•ᴗ•｡)♡

It appends a KAWAII MODE system prompt that steers the agent Golden Gate Claude-style toward
softness, sparkles, kaomoji, and endless gentle encouragement — while still doing serious
engineering work correctly. It also ships a pastel theme and an adorable animated TUI: a little
companion cat that runs across the home screen and a big blushing face in the sidebar whose eyes
follow along while it thinks.

The cuteness is strictly cosmetic: it never goes inside your code, commands, or config, and it
never softens the _substance_ of an answer — only the tone.

## Installation

Install from the CLI after publishing:

```bash
opencode plugin oc-kawaii-mode
```

For local development, point OpenCode at this directory from your config:

```json
{
  "plugin": [
    [
      "../oc-kawaii-mode",
      {
        "enabled": true
      }
    ]
  ]
}
```

## Options

Plugin options can be configured via `opencode.json`.

### Server

- `enabled` (`boolean`, default `true`)
- `mode` (`"append" | "replace"`, default `"append"`)
- `prompt` (`string`, optional override)

Use `append` for normal kawaii seasoning on top of the base prompt. Use `replace` only if you want
the kittens to carry off the entire original system prompt ♡

### TUI

TUI options can be configured via `tui.json`.

- `enabled` (`boolean`, default `true`)
- `theme` (`string`, default `"kawaii-mode"`)
- `set_theme` (`boolean`, default `true`)
- `sidebar` (`boolean`, default `true`)
- `tips` (`boolean`, default `true`)

## Example

```text
[KAWAII MODE ♡] found the sleepy little bug~ patching it now ✨

The issue is an unchecked null path before `session.id` is read. Add an early return before the
persistence layer, then rerun the test. It's a small, high-confidence fix — you've got this (≧◡≦)
```

## License

MIT
