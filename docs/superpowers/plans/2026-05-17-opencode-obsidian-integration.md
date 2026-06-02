# OpenCode-Obsidian Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish two-way integration between Obsidian and OpenCode for the TFT Bible development workflow.

**Architecture:** Vault at `Documents/vault/` (sibling to project), notes and specs as subdirectories. opencode-obsidian plugin embeds OpenCode in Obsidian sidebar. AGENTS.md documents vault paths for OpenCode context.

**Tech Stack:** Obsidian, OpenCode CLI, opencode-obsidian plugin (TypeScript), Bun

---

### Task 1: Initialize Obsidian Vault

**Files:**
- Create: `Documents/vault/.obsidian/app.json`
- Create: `Documents/vault/.obsidian/community-plugins.json`
- Create: `Documents/vault/.obsidian/core-plugins.json`

- [ ] **Step 1: Create vault skeleton**

The vault directories (`notes/`, `specs/`) already exist. Now create the minimal `.obsidian/` config so Obsidian recognizes it as a vault.

Create `C:\Users\puppets\Documents\vault\.obsidian\` directory and the following files:

**`.obsidian/app.json`**
```json
{
  "alwaysUpdateLinks": true,
  "newFileLocation": "folder",
  "newFileFolderPath": "notes",
  "attachmentFolderPath": "notes/attachments"
}
```

**`.obsidian/core-plugins.json`**
```json
[
  "file-explorer",
  "global-search",
  "switcher",
  "graph",
  "backlink",
  "outgoing-link",
  "tag-pane",
  "page-preview",
  "daily-notes",
  "templates",
  "note-composer",
  "command-palette",
  "editor-status",
  "starred",
  "outline",
  "word-count",
  "file-recovery"
]
```

**`.obsidian/community-plugins.json`**
```json
[]
```

- [ ] **Step 2: Open vault in Obsidian**

Open Obsidian → "Open folder as vault" → select `C:\Users\puppets\Documents\vault\` → Obsidian will finalize init and create any missing internal files. Verify you see `notes/` and `specs/` folders in the file explorer.

- [ ] **Step 3: Commit vault skeleton**

```bash
cd C:\Users\puppets\Documents\tft_bible_v2
git add ../vault/.obsidian
git commit -m "chore: initialize Obsidian vault skeleton"
```

---

### Task 2: Update AGENTS.md

**Files:**
- Modify: `tft_bible_v2/docs/AGENTS.md`

- [ ] **Step 1: Append vault section to AGENTS.md**

Add after line 4 (`## Current Goal`) or before `## Key Decisions`:

```
## Obsidian Vault
- Vault root: `../vault/` (relative to project root)
- Notes: `../vault/notes/` — research, ideas, meeting notes
- Specs: `../vault/specs/` — design documents (read/write)
- OpenCode reads notes from `../vault/notes/` for project context
- OpenCode writes design specs to `../vault/specs/`
```

The exact insertion point is after line 4 (`## Current Goal`) — insert the vault section as a new top-level section before `## Key Decisions`.

- [ ] **Step 2: Commit**

```bash
git add docs/AGENTS.md
git commit -m "docs: add Obsidian vault section to AGENTS.md"
```

---

### Task 3: Install opencode-obsidian Plugin

**Method:** BRAT (recommended) or manual

- [ ] **Step 1: Install BRAT (if using BRAT method)**

1. Open Obsidian → Settings → Community Plugins → Browse
2. Search for "BRAT" (Beta Reviewer's Auto-update Tool) by TfTHacker
3. Install and enable BRAT
4. BRAT Settings → Add Beta Plugin → Enter `mtymek/opencode-obsidian`
5. Click "Add Plugin" — BRAT downloads and installs

- [ ] **Step 2: Manual install (if not using BRAT)**

```bash
cd C:\Users\puppets\Documents\vault\.obsidian\plugins
git clone https://github.com/mtymek/opencode-obsidian.git obsidian-opencode
cd obsidian-opencode
bun install
bun run build
```

- [ ] **Step 3: Enable the plugin**

Obsidian → Settings → Community Plugins → Find "OpenCode" → Enable it

- [ ] **Step 4: Verify OpenCode binary exists on PATH**

```powershell
where opencode.cmd
```

Expected output: `C:\Users\puppets\AppData\Roaming\npm\opencode.cmd`

If not found, install OpenCode CLI first.

---

### Task 4: Configure Plugin Settings

- [ ] **Step 1: Set plugin configuration**

In Obsidian → Settings → OpenCode, set:

| Setting | Value |
|---------|-------|
| Port | 14096 |
| Hostname | 127.0.0.1 |
| Working directory | `C:\Users\puppets\Documents\tft_bible_v2` |
| Auto-start | Enabled |
| Context injection | Enabled |
| CORS | `app://obsidian.md` (included by default via plugin) |

- [ ] **Step 2: Configure Windows binary path (if needed)**

If the plugin shows "Executable not found at 'opencode'", enable "Use custom command" and set:

```
C:\Users\puppets\AppData\Roaming\npm\opencode.cmd serve --port 14096 --hostname 127.0.0.1 --cors app://obsidian.md
```

And set the binary path to:
```
C:\Users\puppets\AppData\Roaming\npm\opencode.cmd
```

---

### Task 5: Verify Integration

- [ ] **Step 1: Launch and verify**

1. Open Obsidian → vault at `Documents/vault/`
2. Click the terminal icon in the ribbon (or `Cmd+Shift+O`)
3. Verify the OpenCode panel opens in the sidebar
4. Verify OpenCode starts in `tft_bible_v2` directory
5. Ask OpenCode: "What is our current project context?" — it should reference AGENTS.md including the vault section

- [ ] **Step 2: Test context injection**

1. Open a note in Obsidian (e.g., create a test note in `notes/test.md`)
2. Select some text
3. Ask OpenCode a question in the sidebar — verify it can see the open note context

- [ ] **Step 3: Test spec write path**

1. Ask OpenCode to write a short design note to `../vault/specs/test-spec.md`
2. Verify the file appears in Obsidian's file explorer under `specs/`
3. Clean up: delete the test spec file

---

### Task 6: Document Any Windows-Specific Fixes

- [ ] **Step 1: Add Windows troubleshooting to AGENTS.md (if needed)**

If any issues were encountered during setup (e.g., PATH problems, CORS issues), append a troubleshooting note to the vault section in AGENTS.md.
