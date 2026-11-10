from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
root=Path(__file__).parent
source=Path('/workspace/mesmerizer-analysis/assets/fonts/CAB-c9058b3f632c37ae619e26f5db1ad6bf_1757381613706905971_Galmuri11.font')
font=TTFont(source)
options=subset.Options();options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*'];options.recalc_bounds=True
sub=subset.Subsetter(options=options);sub.populate(unicodes=list(range(0x20,0x180))+list(range(0x400,0x500))+[0x2192,0x2014,0x2013,0x2026,0x00b7]);sub.subset(font)
for rec in font['name'].names:
 if rec.nameID in [1,2,3,4,6,16,17]:
  value='Regular' if rec.nameID in [2,17] else 'QuietMeadowPixel-Regular' if rec.nameID==6 else 'Quiet Meadow Pixel'
  rec.string=value.encode(rec.getEncoding(),errors='replace')
font.flavor=None;font.save(root/'assets/quiet-meadow-pixel.ttf')
font.flavor='woff2';font.save(root/'assets/quiet-meadow-pixel.woff2')
# Preserve the author's copyright and the complete OFL, also in the standalone HTML metadata.
license_source=Path('/usr/share/doc/fonts-liberation/copyright')
if not license_source.exists():license_source=next(Path('/usr/share/doc').glob('fonts-liberation*/copyright'))
text=license_source.read_text();text=text[text.index(' SIL OPEN FONT LICENSE'):text.index('\nFiles: debian/')]
text='\n'.join('' if line.strip()=='.' else line[1:] if line.startswith(' ') else line for line in text.splitlines())
license_text='Quiet Meadow Pixel: Latin/Cyrillic subset of Galmuri11, family renamed.\nOriginal copyright (c) 2019-2023 Minseo Lee (itoupluk427@gmail.com).\n\n'+text
(root/'assets/FONT_LICENSE.txt').write_text(license_text)
print('Pixel Cyrillic font:',(root/'assets/quiet-meadow-pixel.woff2').stat().st_size,'bytes')
