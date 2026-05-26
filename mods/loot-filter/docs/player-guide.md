# Loot Filter — player guide

The loot filter is a per-character setting. When it's on, `/loot all` only collects items that match your filter rules; anything else is left in the corpse and you can grab it manually via `/loot` (which opens the normal pick-window).

## Quick start

```text
/lootfilter reset      -- loads a sensible default rule set
/lootfilter on         -- turns the filter on
```

That's it. Kill a creature, do `/loot all`, and you'll see something like:

```
Loot filter: kept 1, left 3 in corpse.
```

You can still `/loot` (no arguments) to open the corpse's container if you want to inspect or grab leftover items.

## Default rules

`/lootfilter reset` loads three rules:

1. **Legendary anything** — any item with the `(Legendary)` suffix.
2. **Exceptional attachments** — any AA or CA with the `(Exceptional)` suffix.
3. **Special drops** — Jedi crystals, Krayt pearls, Mandalorian armor components, blood charges (whatever the server's admin has listed as "special").

These are a safe baseline. The **`/lootfilter` SUI** lets you toggle the master switch, enable/disable individual rules, reload defaults, or clear all — but it doesn't yet let you author new rules. For more nuanced behavior (like "only AAs with precision +15 or higher"), ask your server admin to add the rule to `defaultRules` in `loot_filter.lua`; you'll see it on next `/lootfilter reset`.

## The SUI window

`/lootfilter` (no arguments) opens the loot filter window:

```
Loot Filter
Filter is currently ENABLED.
Rules: 3

Click the top entry to toggle the filter. Click any rule to toggle whether
that rule contributes.

[ON ] Loot filter master switch
  [ON ] Legendary anything
  [ON ] Exceptional attachments
  [ON ] Special drops
→ Reload default rules
→ Clear all rules
```

Clicking any line performs the action and re-opens the window with the
updated state. Cancel closes it.

## All commands

| Command | What it does |
|---|---|
| `/lootfilter on` | Turn the filter on. |
| `/lootfilter off` | Turn it off (`/loot all` works normally). |
| `/lootfilter status` | Print on/off + rule count. |
| `/lootfilter list` | Print each rule with its categories, rarity, and stat minimums. |
| `/lootfilter reset` | Clear your rules and load the default set. |
| `/lootfilter clear` | Remove all your rules (filter stays on/off as set). |
| `/lootfilter help` | Print this list. |

## Reading `/lootfilter list`

```text
[0] ON  Legendary anything — cats=0x1f minRarity=3
[1] ON  Exceptional attachments — cats=0x3 minRarity=2
[2] ON  Special drops — cats=0x60 minRarity=0
```

- `[N]` — rule index.
- `ON` / `off` — whether the rule contributes to the filter (off rules are kept but ignored).
- The name comes from the rule definition.
- `cats=0xN` — category bitmask in hex. `0x01`=AA, `0x02`=CA, `0x04`=weapon, `0x08`=armor, `0x10`=other wearable, `0x20`=blood charge, `0x40`=special drop. OR them together.
- `minRarity=N` — `0`=any, `1`=yellow, `2`=Exceptional, `3`=Legendary.
- `stats=[modName>=N,...]` (only shown if the rule requires stat mins).

## FAQ

**Does it affect group loot?**
No. The filter only fires on `/loot all` for corpses you own solo. Group loot is untouched.

**Does it destroy or sell anything?**
No. Items left out are still in the corpse — `/loot` (no `all`) opens the regular window.

**My filter is on but `/loot all` grabbed everything!**
Three things to check: (1) `/lootfilter status` says ON; (2) you have rules — `/lootfilter list` shows them; (3) you actually own the corpse (group corpses bypass the filter).

**The filter ignored a high-stat attachment.**
The filter checks `minStatMods` exactly — if you require `precision >= 15` and the attachment has `precision +14`, no match. Reduce the threshold or rely on the rarity tier instead.

**My rules disappeared after reset.**
`/lootfilter reset` is destructive — it clears your rules and reloads the defaults. There's no undo.
