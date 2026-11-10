"""Use one browser at a time for the large embedded build; save each independent result."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
jobs=[('city_058.py','city'),('town_v058.py','town'),('city_fixes_058.py','fixes'),('guild_board_058.py','guild'),('neru_058.py','neru'),('skill_games_058.py','skill-games')]
for mode in ['source','offline']:
 for script,label in jobs:
  print('Checking',mode,label,flush=True)
  with (ROOT/'validation'/f'{mode}-{label}.log').open('w') as log:subprocess.run([sys.executable,str(ROOT/'tests'/script),mode],stdout=log,stderr=subprocess.STDOUT,check=True,cwd=ROOT)
  print('PASS',mode,label,flush=True)
with (ROOT/'validation'/'skill-art.log').open('w') as log:subprocess.run([sys.executable,str(ROOT/'tests'/'skill_art_058.py')],stdout=log,stderr=subprocess.STDOUT,check=True,cwd=ROOT)
print('PASS ability art',flush=True)
