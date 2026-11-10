"""Use one browser at a time for the large embedded build; save each independent result."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
jobs=[('city_059.py','city'),('town_v059.py','town'),('city_fixes_059.py','fixes'),('city_markup_059.py','markup'),('guild_board_059.py','guild'),('neru_059.py','neru'),('skill_games_059.py','skill-games')]
for mode in ['source','offline']:
 for script,label in jobs:
  print('Checking',mode,label,flush=True)
  with (ROOT/'validation'/f'{mode}-{label}.log').open('w') as log:subprocess.run([sys.executable,str(ROOT/'tests'/script),mode],stdout=log,stderr=subprocess.STDOUT,check=True,cwd=ROOT)
  print('PASS',mode,label,flush=True)
with (ROOT/'validation'/'skill-art.log').open('w') as log:subprocess.run([sys.executable,str(ROOT/'tests'/'skill_art_059.py')],stdout=log,stderr=subprocess.STDOUT,check=True,cwd=ROOT)
print('PASS ability art',flush=True)
