# /// script
# requires-python = ">=3.11"
# dependencies = ["watchdog>=6.0.0"]
# ///
"""Watch the TFT PBE Paks directory and run the CUE4Parse extractor after patches settle.

Usage:
  uv run tools/pbe-ingest/watcher/watcher.py --once
  uv run tools/pbe-ingest/watcher/watcher.py --set-id 19
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import shutil
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_PAKS_DIR = Path(r"D:\Riot Games\Teamfight Tactics\PBE\TFT\Content\Paks")
EXTRACTOR_DIR = REPO_ROOT / "tools" / "pbe-ingest" / "extractor"
EXTRACTOR_PROJECT = EXTRACTOR_DIR / "extractor.csproj"
LOCAL_DOTNET = REPO_ROOT / "tools" / "dotnet" / "dotnet.exe"
CONTAINER_SUFFIXES = (".utoc", ".ucas", ".pak")
REIMPORT_NOT_READY = 3


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def find_dotnet() -> str:
    if LOCAL_DOTNET.exists():
        return str(LOCAL_DOTNET)
    found = shutil.which("dotnet")
    if found:
        return found
    raise RuntimeError("dotnet not found. Install .NET 10 or keep tools/dotnet in the repo.")


def find_extractor() -> tuple[str, str | None]:
    """Return (dotnet-or-exe, extractor.dll-or-None). Builds the project when needed."""
    override = os.environ.get("TFT_PBE_EXTRACTOR")
    if override:
        path = Path(override)
        if path.suffix.lower() == ".dll":
            return find_dotnet(), str(path)
        return str(path), None

    dotnet = find_dotnet()
    dll = EXTRACTOR_DIR / "bin" / "Release" / "net10.0" / "extractor.dll"
    sources = list(EXTRACTOR_DIR.glob("*.cs")) + [EXTRACTOR_PROJECT]
    needs_build = not dll.exists()
    if not needs_build:
        dll_mtime = dll.stat().st_mtime
        needs_build = any(p.stat().st_mtime > dll_mtime for p in sources if p.exists())

    if needs_build:
        logging.info("building extractor (dotnet build -c Release)")
        result = subprocess.run(
            [dotnet, "build", "-c", "Release", str(EXTRACTOR_PROJECT)],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            logging.error("extractor build failed:\n%s\n%s", result.stdout[-4000:], result.stderr[-4000:])
            raise RuntimeError("extractor build failed")
        logging.info("extractor build succeeded")

    if not dll.exists():
        raise RuntimeError(f"extractor assembly not found: {dll}")
    return dotnet, str(dll)


def extractor_env(dotnet: str) -> dict[str, str]:
    env = os.environ.copy()
    if Path(dotnet).name.lower() == "dotnet.exe" and LOCAL_DOTNET.exists():
        env["DOTNET_ROOT"] = str(LOCAL_DOTNET.parent)
    return env


def container_files(paks_dir: Path) -> list[Path]:
    return sorted(p for p in paks_dir.iterdir() if p.is_file() and p.suffix.lower() in CONTAINER_SUFFIXES)


def fingerprint(paks_dir: Path) -> str:
    digest = hashlib.sha1()
    for path in container_files(paks_dir):
        stat = path.stat()
        digest.update(f"{path.name}:{stat.st_size}:{stat.st_mtime_ns}\n".encode())
    return digest.hexdigest()


def mappings_path(args: argparse.Namespace) -> Path | None:
    if args.mappings:
        return Path(args.mappings)
    for candidate in (
        Path(os.environ.get("TFT_PBE_MAPPINGS", "")),
        REPO_ROOT / "tools" / "pbe-ingest" / "mappings" / "TFT.usmap",
        REPO_ROOT / "tools" / "pbe-ingest" / "mappings" / "TFT.jmap",
        REPO_ROOT / "data" / "pbe_extracted" / "TFT.usmap",
    ):
        if str(candidate) and candidate.is_file():
            return candidate
    return None


def run_extractor(args: argparse.Namespace, paks_dir: Path, out_dir: Path) -> int:
    dotnet, dll = find_extractor()
    mapping = mappings_path(args)
    executable = [dotnet] + ([dll] if dll else [])
    command = executable + [
        "--paks", str(paks_dir),
        "--out", str(out_dir),
        "--mode", "all",
        "--scope", "set",
    ]
    if mapping:
        command += ["--mappings", str(mapping)]
    if args.set_id:
        command += ["--set", str(args.set_id)]

    logging.info("running extractor (mappings=%s)", mapping or "none")
    result = subprocess.run(command, cwd=str(REPO_ROOT), env=extractor_env(dotnet), capture_output=True, text=True)
    for line in (result.stdout + result.stderr).splitlines():
        logging.info("extractor: %s", line)
    if result.returncode == 0:
        logging.info("extractor finished successfully")
    elif result.returncode == 2:
        logging.warning("extractor finished without DataTable mappings; inventory/string tables were still written")
    else:
        logging.error("extractor failed with exit code %s", result.returncode)
    return result.returncode


def read_manifest(out_dir: Path) -> dict:
    path = out_dir / "manifest.json"
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # manifest is diagnostic, never fatal
        logging.warning("could not parse manifest: %s", exc)
        return {}


def newest_set(manifest: dict) -> int | None:
    best = None
    for entry in manifest.get("sets", []):
        try:
            sid = int(entry.get("set"))
        except (TypeError, ValueError):
            continue
        if best is None or sid > best:
            best = sid
    return best


def run_pbe_reimport(set_id: int) -> int:
    npm = shutil.which("npm.cmd") or shutil.which("npm")
    if not npm:
        logging.error("npm not found; cannot run backend PBE reimport")
        return 1
    command = [npm, "run", "reimport", "--", "--pbe", str(set_id)]
    env = os.environ.copy()
    env["CDRAGON_ENDPOINT"] = "pbe"
    logging.info("running backend reimport: %s", " ".join(command))
    result = subprocess.run(command, cwd=str(REPO_ROOT / "backend"), env=env, capture_output=True, text=True)
    output = result.stdout + result.stderr
    for line in output.splitlines():
        logging.info("reimport: %s", line)
    if result.returncode != 0:
        logging.error("reimport failed with exit code %s", result.returncode)
        return result.returncode
    if f"set {set_id} has 0 champions" in output:
        logging.warning("PBE CDragon has no champions for set %s yet; will retry", set_id)
        return REIMPORT_NOT_READY
    return 0


def load_state(state_path: Path) -> dict:
    if not state_path.is_file():
        return {}
    try:
        return json.loads(state_path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(state_path: Path, payload: dict) -> None:
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def run_pipeline(args: argparse.Namespace, paks_dir: Path, out_dir: Path, force: bool) -> int:
    current = fingerprint(paks_dir)
    state_path = out_dir / "watcher_state.json"
    state = load_state(state_path)
    if not force and state.get("fingerprint") == current:
        logging.info("Paks unchanged since last run; skipping")
        return 0

    out_dir.mkdir(parents=True, exist_ok=True)
    logging.info("patch fingerprint %s", current[:12])
    extractor_code = run_extractor(args, paks_dir, out_dir)
    manifest = read_manifest(out_dir)
    counts = manifest.get("counts", {})
    logging.info(
        "inventory: %s data tables (%s in scope), %s string tables",
        counts.get("dataTables", "?"),
        counts.get("dataTablesInScope", "?"),
        counts.get("stringTables", "?"),
    )

    ingest_code = 0
    set_id = args.set_id
    if set_id is None and not args.no_ingest:
        set_id = newest_set(manifest)
        if set_id is not None:
            logging.info("newest set in Paks is %s; reimporting it", set_id)
    if set_id and not args.no_ingest:
        ingest_code = run_pbe_reimport(set_id)

    save_state(state_path, {
        "fingerprint": current,
        "lastRunAt": utc_now(),
        "extractorExit": extractor_code,
        "reimportExit": ingest_code,
        "setId": set_id,
        "pendingSet": set_id if ingest_code == REIMPORT_NOT_READY else None,
        "counts": counts,
        "mappings": manifest.get("mappings"),
        "manifest": str(out_dir / "manifest.json"),
    })
    return 0 if extractor_code in (0, 2) and ingest_code in (0, REIMPORT_NOT_READY) else 1


class PaksEventHandler(FileSystemEventHandler):
    def __init__(self) -> None:
        self.dirty = False
        self.last_event = 0.0
        self.lock = threading.Lock()

    def on_any_event(self, event: FileSystemEvent) -> None:
        if event.is_directory:
            return
        if Path(event.src_path).suffix.lower() not in CONTAINER_SUFFIXES:
            return
        with self.lock:
            self.dirty = True
            self.last_event = time.monotonic()

    def snapshot(self) -> tuple[bool, float]:
        with self.lock:
            return self.dirty, self.last_event

    def clear(self) -> None:
        with self.lock:
            self.dirty = False


def watch(args: argparse.Namespace, paks_dir: Path, out_dir: Path) -> int:
    if not paks_dir.is_dir():
        logging.error("Paks directory not found: %s", paks_dir)
        return 1

    handler = PaksEventHandler()
    observer = Observer()
    observer.schedule(handler, str(paks_dir), recursive=False)
    observer.start()
    logging.info("watching %s (settle %ss)", paks_dir, args.settle_seconds)

    if not args.no_initial:
        run_pipeline(args, paks_dir, out_dir, force=False)

    pending_fp: str | None = None
    pending_since = 0.0
    next_retry = 0.0
    state_path = out_dir / "watcher_state.json"
    try:
        while True:
            time.sleep(args.poll_seconds)
            if not args.no_ingest and time.monotonic() >= next_retry:
                pending_set = load_state(state_path).get("pendingSet")
                if pending_set:
                    code = run_pbe_reimport(int(pending_set))
                    if code == 0:
                        state = load_state(state_path)
                        state.update({"pendingSet": None, "reimportExit": 0, "lastRunAt": utc_now()})
                        save_state(state_path, state)
                        logging.info("pending reimport for set %s completed", pending_set)
                    next_retry = time.monotonic() + args.retry_seconds

            dirty, last_event = handler.snapshot()
            if not dirty:
                continue
            now = time.monotonic()
            if now - last_event < args.settle_seconds:
                continue

            current = fingerprint(paks_dir)
            if current != pending_fp:
                pending_fp = current
                pending_since = now
                logging.info("patch files changed; waiting for them to settle")
                continue
            if now - pending_since < args.settle_seconds:
                continue

            logging.info("patch files settled")
            handler.clear()
            pending_fp = None
            run_pipeline(args, paks_dir, out_dir, force=True)
    except KeyboardInterrupt:
        logging.info("stopping watcher")
    finally:
        observer.stop()
        observer.join()
    return 0


def setup_logging(out_dir: Path, verbose: bool) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
    try:
        handlers.append(logging.FileHandler(out_dir / "watcher.log", encoding="utf-8"))
    except OSError:
        pass
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
        handlers=handlers,
        force=True,
    )


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Watch TFT PBE paks and extract/ingest after patches.")
    parser.add_argument("--paks", default=os.environ.get("TFT_PBE_PAKS_DIR", str(DEFAULT_PAKS_DIR)))
    parser.add_argument("--out", default=os.environ.get("TFT_PBE_OUT_DIR", str(REPO_ROOT / "data" / "pbe_extracted")))
    parser.add_argument("--mappings", default=None, help=".usmap/.jmap mappings for DataTable rows")
    parser.add_argument("--set-id", type=int, default=None, help="Set to reimport from PBE CDragon (default: newest set found in the Paks)")
    parser.add_argument("--settle-seconds", type=float, default=60.0)
    parser.add_argument("--poll-seconds", type=float, default=2.0)
    parser.add_argument("--retry-seconds", type=float, default=300.0, help="Retry interval while PBE CDragon lacks the new set")
    parser.add_argument("--once", action="store_true", help="Run the pipeline once and exit")
    parser.add_argument("--no-initial", action="store_true", help="Do not run at watcher startup")
    parser.add_argument("--no-ingest", action="store_true", help="Skip backend CDragon reimport")
    parser.add_argument("--force", action="store_true", help="Run even if the Paks fingerprint is unchanged")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    paks_dir = Path(args.paks)
    out_dir = Path(args.out)
    setup_logging(out_dir, args.verbose)
    logging.info("TFT PBE ingest watcher started at %s", utc_now())

    try:
        if args.once:
            return run_pipeline(args, paks_dir, out_dir, force=True)
        return watch(args, paks_dir, out_dir)
    except Exception as exc:
        logging.exception("watcher failed: %s", exc)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
