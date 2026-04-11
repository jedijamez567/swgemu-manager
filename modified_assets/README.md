# Modified Client Assets

Patched copies of SWG client files used to unlock behavior that is hardcoded
in the stock client and cannot be overridden via TRE files or server config.

Files here are **not** volume-mounted into the Docker container. They are
meant to be produced by a build step and then copied manually into the SWG
client install directory on each player's machine (typically
`C:\SWGEmu\SWGEmu\`). Always back up the original before replacing.

| File | Purpose |
|---|---|
| `SWGEmu.exe` | Patched client with the hardcoded Jedi profession filter removed |
| `SWGEmu.exe.bak` | Backup of the stock client produced by the build script |

Neither `SWGEmu.exe` nor its backup is committed to the repository &mdash; they are
derived artifacts, they are large (~22 MB), and the stock client is
copyrighted. This directory ships only as a staging location and this README.

## Producing `SWGEmu.exe`

Use the build script at `scripts/build_custom_client.py`. From the repo root:

```bash
# Build a custom client into a fresh output directory
python3 scripts/build_custom_client.py build \
    --source /path/to/stock/SWGEmu \
    --dest   ./modified_assets

# Or patch an existing client install in place
python3 scripts/build_custom_client.py build \
    --source /path/to/SWGEmu \
    --in-place
```

The script is idempotent: running it twice against an already-patched client
is a harmless no-op. Verify the state of a client at any time with:

```bash
python3 scripts/build_custom_client.py verify --source /path/to/SWGEmu
```

See [CLAUDE.md](../CLAUDE.md#client-binary-patching) for the full technical
details of the patch (offset, byte sequence, rationale) and the server-side
requirements (`allowJediStartingProfession = 1`, custom TRE with Jedi PRFI)
that must be in place for the Jedi profession to actually appear in the
character-creation dropdown once the client has been patched.
