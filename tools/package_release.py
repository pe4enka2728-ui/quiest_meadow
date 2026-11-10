"""Package a checked-out game version for GitHub Releases, without workspace-specific paths."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tag', help='Require this tag to match LevelData.version.')
    args = parser.parse_args()
    match = re.search(r"version:\s*['\"]([0-9]+(?:\.[0-9]+)+)['\"]", (ROOT / 'level.js').read_text())
    if not match:
        raise SystemExit('Cannot read LevelData.version')
    version = match.group(1)
    if args.tag and args.tag != 'v' + version:
        raise SystemExit(f'Tag {args.tag} does not match game version {version}')
    build = ROOT / 'play.html'
    if not build.is_file():
        raise SystemExit('Run python build.py first.')
    raw = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT)
    tracked = [ROOT / p for p in raw.decode().split('\0') if p]
    if not tracked:
        raise SystemExit('No tracked source files to package')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    out = ROOT / 'dist'
    out.mkdir(exist_ok=True)
    name = 'Quiet-Meadow-' + version
    html = out / (name + '.html')
    shutil.copy2(build, html)
    game_zip = out / (name + '.zip')
    prefix = 'Tihaya-Polyana-' + version + '/'
    with zipfile.ZipFile(game_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        archive.write(html, prefix + 'Play.html')
        documents = ['README.md', 'START_HERE.txt']
        for stem in ['CHANGES_', 'DESIGN_', 'VALIDATION_']:
            documents.append(stem + version.replace('.', '').zfill(3) + '.md')
        for filename in documents:
            path = ROOT / filename
            if path.is_file():
                archive.write(path, prefix + filename)
        preview = ROOT / 'docs/city-overview.png'
        if preview.is_file():
            archive.write(preview, prefix + 'City-overview.png')
    source_zip = out / (name + '-sources.zip')
    with zipfile.ZipFile(source_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in sorted(tracked):
            if path.is_file():
                archive.write(path, name + '-sources/' + str(path.relative_to(ROOT)))
    for path in [game_zip, source_zip]:
        with zipfile.ZipFile(path) as archive:
            if archive.testzip() is not None:
                raise SystemExit('Broken ZIP: ' + path.name)
    with zipfile.ZipFile(game_zip) as archive:
        assert hashlib.sha256(archive.read(prefix + 'Play.html')).hexdigest() == sha(build)
    manifest = dict(version=version, tag='v' + version, commit=commit, artifacts=[
        dict(name=p.name, bytes=p.stat().st_size, sha256=sha(p))
        for p in [game_zip, html, source_zip]
    ])
    (out / (name + '-manifest.json')).write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
