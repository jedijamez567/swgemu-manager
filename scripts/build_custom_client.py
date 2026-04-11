#!/usr/bin/env python3
"""
build_custom_client.py - Build a custom SWG client from a stock install.

Produces a customized SWG client for the Chevelle galaxy by:
  1. Applying the Jedi profession filter binary patch to SWGEmu.exe so the
     Jedi profession appears in the character-creation dropdown.
  2. (Optionally) Copying custom TRE files into the client's TRE directory.
  3. (Optionally) Registering those custom TRE files at the top of the client's
     swgemu_live.cfg load order (first loaded = highest priority).

Run `build_custom_client.py --help` for usage. See CLAUDE.md "Client Binary
Patching" for technical details on the SWGEmu.exe patch.

This script has no third-party dependencies - only the Python standard library.
Python 3.7+ is required.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Jedi profession filter patch constants
#
# The stock SWGEmu client filters "jedi" out of the profession dropdown in
# SwgCuiAvatarSetupProf::performActivate(). The filter references a single
# null-terminated "jedi\0" string literal at a fixed offset in the .rdata
# section. Overwriting those 4 bytes with "xxxx" neutralizes the filter
# without changing the file size.
# ---------------------------------------------------------------------------
EXPECTED_EXE_NAME = "SWGEmu.exe"
EXPECTED_EXE_SIZE = 22_061_142
PATCH_OFFSET = 0x014A57D8
PATCH_ORIGINAL = b"jedi"  # 6A 65 64 69
PATCH_REPLACEMENT = b"xxxx"  # 78 78 78 78
PATCH_NULL_TERMINATOR_OFFSET = PATCH_OFFSET + len(PATCH_ORIGINAL)


class BuildError(Exception):
    """A fatal error that aborts the build with exit code 1."""


# ---------------------------------------------------------------------------
# Pretty printing
# ---------------------------------------------------------------------------

_USE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def _c(code: str, text: str) -> str:
    if not _USE_COLOR:
        return text
    return f"\033[{code}m{text}\033[0m"


def info(msg: str) -> None:
    print(f"{_c('36', '[*]')} {msg}")


def ok(msg: str) -> None:
    print(f"{_c('32', '[+]')} {msg}")


def warn(msg: str) -> None:
    print(f"{_c('33', '[!]')} {msg}")


def err(msg: str) -> None:
    print(f"{_c('31', '[x]')} {msg}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Binary patch logic
# ---------------------------------------------------------------------------


@dataclass
class PatchResult:
    """Outcome of a single SWGEmu.exe patch attempt."""

    applied: bool  # True if bytes were written; False if already-patched no-op
    already_patched: bool
    file_size: int
    sha256_before: str
    sha256_after: str


def _read_patch_bytes(data: bytes) -> bytes:
    end = PATCH_OFFSET + len(PATCH_ORIGINAL)
    if len(data) < end:
        raise BuildError(
            f"File is only {len(data)} bytes - too small to contain the patch "
            f"offset 0x{PATCH_OFFSET:X}"
        )
    return data[PATCH_OFFSET:end]


def _check_null_terminator(data: bytes) -> None:
    # The filter relies on the original "jedi\0" literal; if offset+4 is not
    # 0x00 the file is structured differently than expected and the patch
    # almost certainly targets the wrong place.
    if len(data) <= PATCH_NULL_TERMINATOR_OFFSET:
        raise BuildError("File ends before the expected null terminator")
    if data[PATCH_NULL_TERMINATOR_OFFSET] != 0:
        raise BuildError(
            f"Expected null terminator at 0x{PATCH_NULL_TERMINATOR_OFFSET:X} "
            f"but found 0x{data[PATCH_NULL_TERMINATOR_OFFSET]:02X}; this does "
            f"not look like the expected SWGEmu.exe build."
        )


def patch_exe_bytes(data: bytes) -> Tuple[bytes, PatchResult]:
    """
    Apply the Jedi profession filter patch to a bytes buffer.

    Returns the new buffer and a PatchResult describing the outcome.
    Raises BuildError if the buffer doesn't look like the expected SWGEmu.exe.
    """
    sha_before = hashlib.sha256(data).hexdigest()
    size = len(data)
    current = _read_patch_bytes(data)

    if current == PATCH_REPLACEMENT:
        # Already patched - idempotent no-op
        return data, PatchResult(
            applied=False,
            already_patched=True,
            file_size=size,
            sha256_before=sha_before,
            sha256_after=sha_before,
        )

    if current != PATCH_ORIGINAL:
        raise BuildError(
            f"Expected bytes 0x{PATCH_ORIGINAL.hex()} at offset "
            f"0x{PATCH_OFFSET:X} but found 0x{current.hex()}. The client "
            f"binary does not match the known SWGEmu build."
        )

    _check_null_terminator(data)

    patched = bytearray(data)
    patched[PATCH_OFFSET : PATCH_OFFSET + len(PATCH_REPLACEMENT)] = PATCH_REPLACEMENT
    patched_bytes = bytes(patched)
    sha_after = hashlib.sha256(patched_bytes).hexdigest()

    return patched_bytes, PatchResult(
        applied=True,
        already_patched=False,
        file_size=size,
        sha256_before=sha_before,
        sha256_after=sha_after,
    )


def patch_exe_file(exe_path: Path, *, backup: bool, dry_run: bool) -> PatchResult:
    """
    Apply the Jedi profession filter patch to SWGEmu.exe on disk.

    If backup is True, writes <exe_path>.bak before modifying. If dry_run is
    True, computes the patch result but does not write anything.
    """
    if not exe_path.is_file():
        raise BuildError(f"SWGEmu.exe not found at {exe_path}")

    size = exe_path.stat().st_size
    if size != EXPECTED_EXE_SIZE:
        warn(
            f"SWGEmu.exe is {size} bytes; expected {EXPECTED_EXE_SIZE}. "
            f"Proceeding anyway, but the patch offset may not match."
        )

    data = exe_path.read_bytes()
    patched, result = patch_exe_bytes(data)

    if result.already_patched:
        ok(f"SWGEmu.exe already patched (sha256 {result.sha256_after[:12]}...)")
        return result

    if dry_run:
        info(
            f"[dry-run] Would patch {exe_path} "
            f"(sha256 {result.sha256_before[:12]} -> {result.sha256_after[:12]})"
        )
        return result

    if backup:
        backup_path = exe_path.with_suffix(exe_path.suffix + ".bak")
        if backup_path.exists():
            info(f"Backup already exists at {backup_path}, leaving it alone")
        else:
            shutil.copy2(exe_path, backup_path)
            ok(f"Backed up original to {backup_path}")

    # Write atomically: write to a temp file in the same directory, then
    # rename over the original. This avoids leaving a truncated .exe on disk
    # if we're killed mid-write.
    fd, tmp_name = tempfile.mkstemp(
        prefix=".swgemu-patch-", dir=str(exe_path.parent)
    )
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(patched)
        shutil.copystat(exe_path, tmp_name)
        os.replace(tmp_name, exe_path)
    except Exception:
        # Best-effort cleanup on failure
        try:
            os.unlink(tmp_name)
        except FileNotFoundError:
            pass
        raise

    ok(
        f"Patched {exe_path.name} at 0x{PATCH_OFFSET:X}: "
        f"{PATCH_ORIGINAL.decode()!r} -> {PATCH_REPLACEMENT.decode()!r}"
    )
    return result


def verify_exe_file(exe_path: Path) -> bool:
    """Return True if SWGEmu.exe contains the patched bytes."""
    if not exe_path.is_file():
        raise BuildError(f"SWGEmu.exe not found at {exe_path}")
    data = exe_path.read_bytes()
    current = _read_patch_bytes(data)
    if current == PATCH_REPLACEMENT:
        ok(f"{exe_path} is patched (bytes at 0x{PATCH_OFFSET:X} = 'xxxx')")
        return True
    if current == PATCH_ORIGINAL:
        warn(f"{exe_path} is NOT patched (bytes at 0x{PATCH_OFFSET:X} = 'jedi')")
        return False
    err(
        f"{exe_path} has unexpected bytes 0x{current.hex()} at "
        f"0x{PATCH_OFFSET:X}; neither the stock nor the patched build."
    )
    return False


# ---------------------------------------------------------------------------
# TRE file staging
# ---------------------------------------------------------------------------


def copy_custom_tres(
    tre_source: Path, client_dir: Path, *, dry_run: bool
) -> List[str]:
    """
    Copy every *.tre file from tre_source into client_dir.

    Returns the list of copied filenames (basenames only) in the order they
    appear on disk. Does not recurse into subdirectories.
    """
    if not tre_source.is_dir():
        raise BuildError(f"Custom TRE source directory not found: {tre_source}")

    tres = sorted(p for p in tre_source.iterdir() if p.suffix.lower() == ".tre")
    if not tres:
        warn(f"No .tre files found in {tre_source}")
        return []

    copied: List[str] = []
    for src in tres:
        dest = client_dir / src.name
        if dry_run:
            info(f"[dry-run] Would copy {src.name} -> {dest}")
        else:
            shutil.copy2(src, dest)
            ok(f"Copied {src.name} -> {dest}")
        copied.append(src.name)
    return copied


# ---------------------------------------------------------------------------
# swgemu_live.cfg update
#
# The client config lists TRE archives in a searchPath section. The exact
# format varies by launcher, but the common shape is:
#
#     [SharedFile]
#         searchTree_00_0    = default_patch.tre
#         searchTree_00_1    = patch_14_00.tre
#         ...
#
# Rather than rewriting the entire file, we append a dedicated block that
# lists our custom archives with indices LOWER than anything the stock config
# uses (negative indices don't work, so we insert them with a distinct prefix
# that most tools load first). If the file already contains our managed block,
# we replace it in place so repeated runs stay idempotent.
# ---------------------------------------------------------------------------


_MANAGED_BLOCK_BEGIN = "# >>> custom-client-builder BEGIN (auto-generated) >>>"
_MANAGED_BLOCK_END = "# <<< custom-client-builder END <<<"


def _build_managed_block(tre_names: Iterable[str]) -> str:
    lines = [_MANAGED_BLOCK_BEGIN]
    lines.append("[SharedFile]")
    for i, name in enumerate(tre_names):
        # Use the "searchTree_cc_*" prefix (cc = "custom client") so the keys
        # sort before the stock "searchTree_NN_*" keys in any launcher that
        # sorts keys lexically.
        lines.append(f"    searchTree_cc_{i}    = {name}")
    lines.append(_MANAGED_BLOCK_END)
    return "\n".join(lines) + "\n"


def update_swgemu_live_cfg(
    cfg_path: Path, tre_names: List[str], *, dry_run: bool
) -> bool:
    """
    Register custom TRE files in the client's swgemu_live.cfg.

    Returns True if the file was modified (or would be in dry-run), False if
    nothing needed to change.
    """
    if not tre_names:
        return False

    block = _build_managed_block(tre_names)

    existing = ""
    if cfg_path.exists():
        existing = cfg_path.read_text(encoding="utf-8", errors="replace")

    pattern = re.compile(
        re.escape(_MANAGED_BLOCK_BEGIN)
        + r".*?"
        + re.escape(_MANAGED_BLOCK_END)
        + r"\n?",
        re.DOTALL,
    )
    if pattern.search(existing):
        new_contents = pattern.sub(block, existing)
        action = "Updated"
    else:
        sep = "" if existing.endswith("\n") or not existing else "\n"
        new_contents = existing + sep + "\n" + block
        action = "Appended"

    if new_contents == existing:
        info(f"{cfg_path.name} already lists the custom TREs; no change")
        return False

    if dry_run:
        info(f"[dry-run] Would {action.lower()} custom TRE block in {cfg_path}")
        return True

    cfg_path.parent.mkdir(parents=True, exist_ok=True)
    cfg_path.write_text(new_contents, encoding="utf-8")
    ok(f"{action} custom TRE block in {cfg_path}")
    return True


# ---------------------------------------------------------------------------
# High-level orchestration
# ---------------------------------------------------------------------------


@dataclass
class BuildOptions:
    source: Path
    dest: Path
    tre_source: Optional[Path]
    in_place: bool
    dry_run: bool
    skip_exe_patch: bool
    no_backup: bool


def _stage_client_tree(source: Path, dest: Path, *, dry_run: bool) -> None:
    """Copy the stock client tree from source to dest."""
    if dest.exists() and any(dest.iterdir()):
        raise BuildError(
            f"Destination {dest} already exists and is not empty. "
            f"Pass --in-place to modify the source directory directly, "
            f"or choose a different --dest path."
        )

    if dry_run:
        info(f"[dry-run] Would copy client tree {source} -> {dest}")
        return

    info(f"Copying client tree {source} -> {dest} (this may take a minute)...")
    shutil.copytree(source, dest, dirs_exist_ok=True)
    ok("Client tree copied")


def build_custom_client(opts: BuildOptions) -> int:
    if not opts.source.is_dir():
        raise BuildError(f"Source client directory not found: {opts.source}")

    source_exe = opts.source / EXPECTED_EXE_NAME
    if not source_exe.is_file():
        raise BuildError(
            f"Source directory {opts.source} does not contain "
            f"{EXPECTED_EXE_NAME}. Is this actually a SWG client install?"
        )

    if opts.in_place:
        work_dir = opts.source
        info(f"Operating in-place on {work_dir}")
    else:
        work_dir = opts.dest
        _stage_client_tree(opts.source, work_dir, dry_run=opts.dry_run)

    # 1) Binary patch
    if opts.skip_exe_patch:
        info("Skipping SWGEmu.exe binary patch (--skip-exe-patch)")
    else:
        target_exe = work_dir / EXPECTED_EXE_NAME
        if opts.dry_run and not opts.in_place:
            # We didn't actually copy the tree, so fall back to reading from
            # the source so the dry-run still exercises the patch validation.
            target_exe = source_exe
        patch_exe_file(
            target_exe, backup=not opts.no_backup, dry_run=opts.dry_run
        )

    # 2) Custom TRE files
    copied_tres: List[str] = []
    if opts.tre_source is not None:
        copied_tres = copy_custom_tres(
            opts.tre_source, work_dir, dry_run=opts.dry_run
        )

    # 3) swgemu_live.cfg - only touch it if we actually have custom TREs
    if copied_tres:
        cfg_path = work_dir / "swgemu_live.cfg"
        update_swgemu_live_cfg(cfg_path, copied_tres, dry_run=opts.dry_run)

    print()
    ok("Custom client build complete")
    info(f"  Output:     {work_dir}")
    info(f"  EXE patch:  {'skipped' if opts.skip_exe_patch else 'applied'}")
    info(f"  Custom TREs: {len(copied_tres)}")
    if opts.dry_run:
        warn("Dry run - no files were actually modified")
    return 0


# ---------------------------------------------------------------------------
# Self-test
#
# Builds a synthetic "stock" SWGEmu.exe in a temp directory, runs the full
# patch-and-verify pipeline against it, and asserts the result. This lets the
# patcher logic be validated without needing the real 22 MB client binary.
# ---------------------------------------------------------------------------


def _build_synthetic_exe() -> bytes:
    """
    Produce a buffer the same size as SWGEmu.exe, with the magic "jedi\\0"
    bytes placed at the exact patch offset. The rest is deterministic noise
    so that hashes are stable across runs.
    """
    buf = bytearray(EXPECTED_EXE_SIZE)
    # Deterministic fill (modular arithmetic, no randomness)
    for i in range(0, EXPECTED_EXE_SIZE, 256):
        chunk_len = min(256, EXPECTED_EXE_SIZE - i)
        buf[i : i + chunk_len] = bytes(range(chunk_len))
    buf[PATCH_OFFSET : PATCH_OFFSET + len(PATCH_ORIGINAL)] = PATCH_ORIGINAL
    buf[PATCH_NULL_TERMINATOR_OFFSET] = 0
    return bytes(buf)


def run_self_test() -> int:
    info("Running self-test against a synthetic SWGEmu.exe...")
    failures = 0

    def check(label: str, cond: bool) -> None:
        nonlocal failures
        if cond:
            ok(f"  {label}")
        else:
            err(f"  {label}")
            failures += 1

    # 1) In-memory round trip
    stock = _build_synthetic_exe()
    patched, result = patch_exe_bytes(stock)
    check("stock buffer accepted", True)
    check("patch reported as applied", result.applied and not result.already_patched)
    check("file size unchanged", len(patched) == len(stock))
    check(
        "patched bytes are 'xxxx'",
        patched[PATCH_OFFSET : PATCH_OFFSET + 4] == PATCH_REPLACEMENT,
    )
    check(
        "null terminator preserved",
        patched[PATCH_NULL_TERMINATOR_OFFSET] == 0,
    )

    # 2) Idempotency
    repatched, result2 = patch_exe_bytes(patched)
    check("second patch is a no-op", not result2.applied and result2.already_patched)
    check("second patch buffer unchanged", repatched == patched)

    # 3) Rejection of unknown bytes
    corrupt = bytearray(stock)
    corrupt[PATCH_OFFSET : PATCH_OFFSET + 4] = b"derp"
    rejected = False
    try:
        patch_exe_bytes(bytes(corrupt))
    except BuildError:
        rejected = True
    check("unknown bytes rejected", rejected)

    # 4) On-disk round trip + backup + verify
    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        exe_path = td_path / EXPECTED_EXE_NAME
        exe_path.write_bytes(stock)

        patch_exe_file(exe_path, backup=True, dry_run=False)
        check("backup file created", exe_path.with_suffix(".exe.bak").exists())
        check(
            "backup contains stock bytes",
            exe_path.with_suffix(".exe.bak").read_bytes() == stock,
        )
        check(
            "patched file verifies",
            verify_exe_file(exe_path) is True,
        )

        # Idempotent second run: should not fail, should not double-backup
        patch_exe_file(exe_path, backup=True, dry_run=False)

    # 5) swgemu_live.cfg update + idempotency
    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        cfg_path = td_path / "swgemu_live.cfg"
        cfg_path.write_text("[ClientGame]\nhostname = localhost\n")
        names = ["dakota_jedi_profession.tre", "dakotatest2.tre"]

        changed = update_swgemu_live_cfg(cfg_path, names, dry_run=False)
        check("cfg updated on first call", changed is True)
        contents = cfg_path.read_text()
        check(
            "managed block present",
            _MANAGED_BLOCK_BEGIN in contents and _MANAGED_BLOCK_END in contents,
        )
        check(
            "both TREs listed",
            all(name in contents for name in names),
        )
        check(
            "stock line preserved",
            "hostname = localhost" in contents,
        )

        changed2 = update_swgemu_live_cfg(cfg_path, names, dry_run=False)
        check("cfg second call is a no-op", changed2 is False)

        # Changing the list should still produce an update, not a duplicate
        new_names = ["dakota_jedi_profession.tre"]
        update_swgemu_live_cfg(cfg_path, new_names, dry_run=False)
        final = cfg_path.read_text()
        check(
            "removed TRE no longer listed",
            "dakotatest2.tre" not in final,
        )
        check(
            "managed block appears exactly once",
            final.count(_MANAGED_BLOCK_BEGIN) == 1,
        )

    print()
    if failures:
        err(f"Self-test FAILED ({failures} check(s) failed)")
        return 1
    ok("Self-test passed")
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _add_build_args(p: argparse.ArgumentParser) -> None:
    p.add_argument(
        "--source",
        required=True,
        type=Path,
        help="Path to a stock SWG client install (the directory containing SWGEmu.exe)",
    )
    p.add_argument(
        "--dest",
        type=Path,
        default=None,
        help="Where to write the customized client. Required unless --in-place is set.",
    )
    p.add_argument(
        "--in-place",
        action="store_true",
        help="Modify the --source directory directly instead of copying to --dest.",
    )
    p.add_argument(
        "--tre-source",
        type=Path,
        default=None,
        help="Directory of custom *.tre files to copy into the client and register in swgemu_live.cfg.",
    )
    p.add_argument(
        "--skip-exe-patch",
        action="store_true",
        help="Do not apply the SWGEmu.exe Jedi profession filter patch.",
    )
    p.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not create SWGEmu.exe.bak before patching in-place.",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would happen but do not modify anything on disk.",
    )


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="build_custom_client.py",
        description=(
            "Build a custom SWG client for the Chevelle galaxy by applying "
            "the documented SWGEmu.exe Jedi profession filter patch and "
            "staging custom TRE files. See CLAUDE.md for background."
        ),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    build_p = sub.add_parser("build", help="Build a customized client")
    _add_build_args(build_p)

    verify_p = sub.add_parser(
        "verify", help="Check whether a client's SWGEmu.exe has been patched"
    )
    verify_p.add_argument(
        "--source",
        required=True,
        type=Path,
        help="Path to a SWG client install",
    )

    sub.add_parser("self-test", help="Run the built-in patcher tests")

    args = parser.parse_args(argv)

    try:
        if args.command == "build":
            if not args.in_place and args.dest is None:
                parser.error("--dest is required unless --in-place is given")
            opts = BuildOptions(
                source=args.source.resolve(),
                dest=(args.dest.resolve() if args.dest else args.source.resolve()),
                tre_source=(args.tre_source.resolve() if args.tre_source else None),
                in_place=args.in_place,
                dry_run=args.dry_run,
                skip_exe_patch=args.skip_exe_patch,
                no_backup=args.no_backup,
            )
            return build_custom_client(opts)

        if args.command == "verify":
            exe_path = args.source.resolve() / EXPECTED_EXE_NAME
            return 0 if verify_exe_file(exe_path) else 1

        if args.command == "self-test":
            return run_self_test()

    except BuildError as e:
        err(str(e))
        return 1

    parser.error(f"Unknown command: {args.command}")
    return 2  # unreachable


if __name__ == "__main__":
    sys.exit(main())
