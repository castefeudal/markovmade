"""Subset bundled fonts without changing authored letterforms.
Requires fonttools and brotli; the normal build uses the committed output.
Font copyright and license name records are retained.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont

root=Path(__file__).resolve().parent.parent
for path in (root/'assets/media/fonts').glob('*.woff2'):
    font=TTFont(path)
    font.ensureDecompiled()
    if 'fvar' in font:
        limits={'wght':500} if path.name.startswith('cormorant') else {'wght':(400,800)}
        font=instantiateVariableFont(font,limits,inplace=True)
    if 'gvar' in font:
        # Some upstream subsets omit empty variation records for static glyphs.
        for glyph in font.getGlyphOrder():
            if glyph not in font['gvar'].variations:
                font['gvar'].variations[glyph]=[]
    options=subset.Options()
    options.flavor='woff2'
    options.name_IDs=[0,1,2,3,4,5,6,13,14]
    options.name_legacy=True
    options.name_languages=['*']
    options.layout_features=['*']
    options.recalc_timestamp=False
    sub=subset.Subsetter(options=options)
    # The RU display face includes Latin/common glyphs to avoid a second
    # webfont-family fallback. Original split faces remain for EN/components.
    codepoints=(list(range(0x400,0x460))+list(range(0x20,0x100))+list(range(0x2000,0x2070))+[0x20ac,0x2116,0x2122,0x2191,0x2193,0x2212]) if '-ru.' in path.name or '-combined.' in path.name else range(0x400,0x460) if 'cyrillic' in path.name else list(range(0x20,0x100))+list(range(0x2000,0x2070))+[0x20ac,0x2116,0x2122,0x2191,0x2193,0x2212]
    sub.populate(unicodes=codepoints)
    sub.subset(font)
    original=path.stat().st_size
    font.flavor='woff2';font.save(path,reorderTables=True)
    print(f'{path.name}: {original} -> {path.stat().st_size} B')
