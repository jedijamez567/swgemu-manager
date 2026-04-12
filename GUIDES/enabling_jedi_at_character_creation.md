# Enabling Jedi at Character Creation

End-to-end runbook for making **Jedi** selectable as a starting profession on a newly-created character. Requires a client binary patch **and** server-side Lua + TRE + SQL changes — each step alone is not enough.

## What this enables

When all steps are complete, a player creating a new character can:

1. See **Jedi** in the profession dropdown (client-side filter removed)
2. Pick it and have the character created with starting items from `profession_defaults_jedi.iff`
3. Start immediately at Padawan rank (`jediState = 2`), skipping the hologrind, with `force_title_jedi_novice` + `force_title_jedi_rank_02` + all `force_sensitive_*` skills granted
4. See the correct Jedi skill tree icons in the skill window

## Prerequisites

- A working SWGEmu server built from this repo (`docker-compose up -d`)
- SWG client installed at `C:\swgemu\swgemu\` with a pristine `SWGEmu.exe.bak` (22,061,142 bytes). If missing, make a backup of the current `SWGEmu.exe` BEFORE applying the patch in Step 1
- MySQL access to the `swgemu` database (root password defaults to `swgemuroot` in this repo's `docker-compose.yml`)
- SIE (SWG Information Editor) from modthegalaxy.com — only needed if you have to regenerate TRE contents

---

## Step 1 — Patch the client binary

The client hardcodes a filter in `SwgCuiAvatarSetupProf::performActivate()` that strips "jedi" from the profession dropdown. The fix is a 1-byte code patch that flips the filter's control-flow branch without touching the shared `"jedi"` string literal at `0x014A57D8` (which is also read by the skill icon classifier — see CLAUDE.md for the full explanation of why data-only patches break the skill tree).

**Patch details:**

| Property | Value |
|---|---|
| Binary | `C:\swgemu\swgemu\SWGEmu.exe` |
| Pristine size | 22,061,142 bytes (matches `SWGEmu.exe.bak`) |
| File offset | `0x00866908` |
| Original bytes | `75 08` (JNZ short +8) |
| Patched bytes | `EB 08` (JMP short +8) |
| Location | Inside `FUN_00c66600` (the `performActivate` filter), immediately after the inlined `CMPSB.REPE` memcmp against `"jedi"` |
| Semantics | Unconditionally bypasses the `DEC [EBP-0x18]; JMP 0x00c66a73` filter path regardless of the memcmp result |

**Apply from git bash / MSYS2:**

```bash
cp C:/swgemu/swgemu/SWGEmu.exe.bak C:/swgemu/swgemu/SWGEmu.exe
printf '\xEB' | dd of=C:/swgemu/swgemu/SWGEmu.exe bs=1 seek=$((0x866908)) count=1 conv=notrunc status=none
```

**Verify:**

```bash
xxd -s 0x866908 -l 2 C:/swgemu/swgemu/SWGEmu.exe      # expect: eb08
xxd -s 0x14a57d8 -l 5 C:/swgemu/swgemu/SWGEmu.exe      # expect: "jedi." (literal untouched)
cmp -l C:/swgemu/swgemu/SWGEmu.exe.bak C:/swgemu/swgemu/SWGEmu.exe
# expect exactly one line: "8808713 165 353"  (1-indexed byte 8808713 = offset 0x866908; octal 165 = 0x75; octal 353 = 0xEB)
```

If `cmp -l` reports more than one differing byte, something is wrong — restore from `.bak` and redo Step 1 from scratch.

**Rollback (instant):**

```bash
cp C:/swgemu/swgemu/SWGEmu.exe.bak C:/swgemu/swgemu/SWGEmu.exe
```

---

## Step 2 — Server Lua config

Enable the starting-jedi profession in `player_creation_manager/player_creation_manager.lua`:

```lua
allowJediStartingProfession = 1
```

Hot-reloadable — `docker-compose restart swgemu` picks it up without a full rebuild.

---

## Step 3 — TRE files

The server reads profession dropdown data and starting-item grants from TRE archives at startup. For Jedi to work as a starting profession, the loaded TREs must contain:

1. **`creation/profession_defaults_jedi.iff`** (PRFI) — the Jedi starting profession definition. The **SKIL chunk must grant `force_title_jedi_novice`** (NOT `force_title_jedi_rank_02` directly) — granting novice is what triggers `HologrindJediManager:onPlayerCreated`'s fast-track to Padawan.
2. **`creation/profession_defaults.iff`** (PFDT) — maps profession keys to PRFI file paths. The stock SWG PFDT does NOT include a jedi entry; you need a modified PFDT that does.
3. **`datatables/creation/profession_mods.iff`** — Jedi attribute row.
4. *(Optional but recommended)* **`datatables/skill/skills.iff`** with populated COMMANDS columns for Jedi rows — needed for the in-game skill tree UI to look correct.

**This repo's custom TREs** (not version-controlled; must be manually placed in the server's `TrePath` directory AND the client's TRE directory):

- **`dakota_jedi_profession.tre`** — contains the PRFI for Jedi plus the six stock-profession PRFI overrides (combat_brawler, combat_marksman, crafting_artisan, outdoors_scout, science_medic, social_entertainer). Does **NOT** contain `creation/profession_defaults.iff` (PFDT) or `datatables/creation/profession_mods.iff` — those must come from another custom TRE.
- **`dakotatest2.tre`** — contains the customized `datatables/skill/skills.iff` with populated COMMANDS columns for Jedi rows.

**Load order precedence**: first-loaded TRE wins. Place custom TREs at the TOP of the `TreFiles` array in both `conf/config.lua` (server) and `swgemu_live.cfg` (client) — the two sides must agree on the profession data.

**Editing TRE contents**: use SIE. The PRFI `SKIL` chunk lives inside each `profession_defaults_*.iff`; the `PFDT` chunks in `profession_defaults.iff` map profession key → PRFI path.

---

## Step 4 — Account-wide Jedi unlock

This is the easy-to-miss step. Even with all of the above, a brand-new account's character creation will silently drop the Jedi SKIL grant because `SkillManager::fulfillsSkillPrerequisites` enforces `jediState < jediStateRequired` BEFORE the `isPrivileged()` bypass. There is a separate `accounts.jedi_unlocked` flag that skips the gate.

State machine:

| `jedi_unlocked` | New character picking Jedi in the dropdown |
|---|---|
| `0` (default) | PRFI SKIL grant silently fails the `canLearnSkill` check — character is created without Jedi. Player must hologrind one character through Brawler/Marksman/Unarmed to master, reach Padawan via Force Shrine meditation, which flips `jedi_unlocked = 1` automatically. |
| `1` | PRFI grant succeeds, character is created at Padawan (`jediState = 2`) with the full Jedi starter kit. |

**To bootstrap an admin/test account directly (skip the hologrind):**

```bash
docker exec -i swgemu_database mysql -uroot -pswgemuroot swgemu \
  -e "UPDATE accounts SET jedi_unlocked = 1 WHERE username = 'admin';"
```

Replace `admin` with the target username. Any character created on that account AFTER this update can pick Jedi and start at Padawan.

**For live players**, the intended flow is to hologrind one character → reach Padawan via Force Shrine meditation → `PlayerObjectImplementation::setJediState` automatically flips `jedi_unlocked` on the account. Every future character on that account then gets the starting-jedi option. See the "Hologrind Jedi System" section in `CLAUDE.md` for the full progression.

---

## Step 5 — Verify in-game

1. Launch the patched `SWGEmu.exe`
2. Log in to an account where `jedi_unlocked = 1`
3. Create a new character
4. Confirm **Jedi** appears in the profession dropdown alongside the stock professions
5. Pick Jedi and complete character creation
6. On the first zone load, confirm:
   - The character has `force_title_jedi_novice` + `force_title_jedi_rank_02` + all `force_sensitive_*` skills (verify via `/examine self` or the skill window)
   - `jediState = 2` (Padawan)
   - The skill window renders the real Jedi skill tree icons (not the default broken placeholder)
7. **Regression check**: log in to a pre-existing non-Jedi character and a pre-existing Jedi character (if you have one) and confirm nothing looks wrong. In particular, the Jedi character's skill tree must still render correctly — this catches any accidental regression to the string-literal patch.

If all checks pass, you're done.

---

## Troubleshooting

### "Entry Point Not Found — `_AIL_set_stream_playback_rate@8`" dialog on launch

Not caused by the binary patch. This is a loader error that fires BEFORE any patched code runs — Windows is saying `SWGEmu.exe`'s import table references a Miles Sound System function that the local `mss32.dll` doesn't export.

**Fix**: the local `mss32.dll` in `C:\swgemu\swgemu\` is the wrong build. Check if there's a `mss32.dll.bak` in the same directory (an older version that did export the function) and restore it:

```bash
cp C:/swgemu/swgemu/mss32.dll.bak C:/swgemu/swgemu/mss32.dll
```

Verify the restored DLL exports the function:

```bash
grep -a "_AIL_set_stream_playback_rate" C:/swgemu/swgemu/mss32.dll
# should print a line containing the function name
```

If neither `mss32.dll` nor `mss32.dll.bak` exports it, you need to source a working Miles Sound System build from a fresh SWGEmu install or the SWGEmu launcher.

### Jedi still not in the dropdown after patching

1. Re-verify the patched bytes:
   ```bash
   xxd -s 0x866908 -l 2 C:/swgemu/swgemu/SWGEmu.exe   # must be eb08
   ```
2. Make sure the client is actually loading the patched `SWGEmu.exe`. Some launchers auto-restore the binary before running — if yours does, you may need to patch AFTER the launcher copies files but BEFORE clicking Play, or patch whatever binary the launcher actually launches.
3. Verify the server's PFDT has a jedi entry. Without it, the server sends a dropdown list that doesn't contain Jedi in the first place, so removing the client-side filter doesn't help. Check the active TRE's `creation/profession_defaults.iff` via SIE.
4. Confirm the server's `allowJediStartingProfession = 1` override is being picked up: `docker-compose logs -f swgemu | grep -i jedi` after a restart.

### Jedi appears in dropdown, character creation succeeds, but the new character has no Jedi skills

The PRFI SKIL grant silently failed the `canLearnSkill` gate. Cause: the account has `jedi_unlocked = 0`. Apply Step 4 and create a new character — existing characters won't retroactively get the Jedi starter kit.

### Jedi skill icons are broken on existing characters after patching

This means the **wrong** patch was applied — the old data-only patch at file offset `0x014A57D8` (overwriting the `"jedi"` string literal) instead of the code patch at `0x00866908`. Restore from `.bak` and re-apply Step 1:

```bash
cp C:/swgemu/swgemu/SWGEmu.exe.bak C:/swgemu/swgemu/SWGEmu.exe
printf '\xEB' | dd of=C:/swgemu/swgemu/SWGEmu.exe bs=1 seek=$((0x866908)) count=1 conv=notrunc status=none
xxd -s 0x14a57d8 -l 5 C:/swgemu/swgemu/SWGEmu.exe   # must read "jedi." — if it reads "xxxx." or similar, the old patch is still there
```

See `CLAUDE.md` → *Client Binary Patching* → *DO NOT patch the `"jedi"` string literal at `0x014A57D8`* for the full explanation of why.

### "Character creation cooldown active"

Unrelated to Jedi, but easy to hit while testing. Lower or disable the cooldown in `player_creation_manager/player_creation_manager.lua` and restart the container.

---

## Re-verifying the filter site against a different SWGEmu build

If you ever need to patch a different build of `SWGEmu.exe`, the file offset `0x00866908` won't necessarily match — function layouts move around across compilations. Re-derive the offset via Ghidra:

1. Import the new `SWGEmu.exe` into a fresh Ghidra project. Auto-analysis takes ~50 minutes on this hardware (the X86 Function Callee Purge analyzer is the bottleneck at ~41 min); let it finish and save.
2. Close the Ghidra GUI (it holds the project lock — headless won't work while it's open).
3. Run the custom xref dumper (path: `C:\Users\dakot\Tools\ghidra_scripts\FindJediStringXrefs.java`) against the new project via headless analyzer:
   ```
   "C:\Users\dakot\Downloads\ghidra_12.0.4_PUBLIC_20260303\ghidra_12.0.4_PUBLIC\support\analyzeHeadless.bat" ^
     <project_dir> <project_name> -process SWGEmu.exe -noanalysis -readOnly ^
     -scriptPath C:\Users\dakot\Tools\ghidra_scripts ^
     -postScript FindJediStringXrefs.java
   ```
4. Find the xref where the decompilation shows the `--outputIndex; continue;` pattern (a local `[EBP - N] = 0` init followed by `DEC [EBP - N]; JMP <loop continue>` after an inlined `CMPSB.REPE` against `"jedi"`). In the current build this is `FUN_00c66600` — only 1 of 10 xrefs matches. All the other xrefs in the current build are skill icon classifiers or static-init atom interning, not filter sites.
5. The patch target is the JNZ immediately after the `CMPSB.REPE` that otherwise falls through into the `DEC` + `JMP continue`. Flip it to an unconditional JMP with the same displacement (2-byte patch: `75 xx` → `EB xx` for short jumps, or `0F 85 xx xx xx xx` → `E9 xx xx xx xx 90` for near jumps).
