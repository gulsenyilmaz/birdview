import os
from pathlib import Path
import requests

DB_URL = os.getenv("DB_URL")
DB_PATH = Path(os.getenv("DB_PATH", "/var/data/birdview.db"))
DB_VERSION = os.getenv("DB_VERSION", "v1")

VERSION_FILE = DB_PATH.parent / "db_version.txt"
CHUNK_SIZE = 1024 * 1024  # 1 MB


def is_db_present() -> bool:
    return DB_PATH.exists() and DB_PATH.stat().st_size > 0


def is_version_current() -> bool:
    if not VERSION_FILE.exists():
        return False
    return VERSION_FILE.read_text(encoding="utf-8").strip() == DB_VERSION


def write_version_file() -> None:
    VERSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    VERSION_FILE.write_text(DB_VERSION, encoding="utf-8")


def download_file(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp_path = destination.with_suffix(destination.suffix + ".tmp")

    print(f"Downloading DB version {DB_VERSION} to {destination} ...")

    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()

        with open(temp_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
                if chunk:
                    f.write(chunk)

    temp_path.replace(destination)
    print("DB downloaded.")


def main() -> None:
    if not DB_URL:
        raise RuntimeError("DB_URL is not set.")

    if is_db_present() and is_version_current():
        print(f"DB already exists at {DB_PATH} and is up to date ({DB_VERSION}). Skipping download.")
        return

    if is_db_present():
        print(f"DB exists at {DB_PATH} but version is outdated or missing. Updating to {DB_VERSION}.")

    download_file(DB_URL, DB_PATH)
    write_version_file()
    print(f"Version file updated to {DB_VERSION}.")


if __name__ == "__main__":
    main()