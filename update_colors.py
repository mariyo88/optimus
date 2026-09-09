#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Color Update Script - FirstCode Rebranding
Paleta bazirana na logu: tamno zelena + krem/bež + zlatna

Nova paleta (iz logoa):
  #0D3B1A — tamno zelena (pozadina kvadrata, footer, dark bg)
  #1A5C2A — zelena (primarni akcent, CTA, dugmad)
  #2E7D42 — srednja zelena (hover stanja)
  #C8A84B — zlatna (borderi, okviri, detalji)
  #A8882B — tamna zlatna (hover na zlatnoj)
  #F0E2C0 — krem (tekst na tamnom, logo slova)
  #F8F0DC — svjetla krem (alternativne sekcije)
  #0A1F0D — skoro crna zelena (outline, naslovi, tekst)
  #5A7A5E — prigušena zelena (muted tekst)
  #E8D8B0 — svjetli border
  #FFFFFF — bijela (glavna pozadina)
"""

import os
import sys

COLOR_MAPPINGS = {
    # === Stara narandžasta paleta (Rebranding 14.0) -> Nova zelena ===
    '#F05A22': '#1A5C2A',  # Narandžasta primary -> Zelena primary
    '#FF6B35': '#2E7D42',  # Narandžasta hover -> Srednja zelena hover
    '#E87722': '#1A5C2A',  # Narandžasta varijanta -> Zelena
    '#E6501B': '#1A5C2A',  # Narandžasta varijanta -> Zelena
    '#F0A500': '#C8A84B',  # Amber -> Zlatna

    # === Stara tamna (#1A1A1A) -> Nova tamno zelena ===
    '#1A1A1A': '#0A1F0D',  # Dark -> Skoro crna zelena
    '#111111': '#0A1F0D',  # Deeper dark -> Skoro crna zelena
    '#0A0A0A': '#0A1F0D',
    '#212121': '#0A1F0D',
    '#1C2024': '#0A1F0D',
    '#1C1C1C': '#0A1F0D',
    '#323232': '#0A1F0D',
    '#333333': '#0A1F0D',
    '#0F1E28': '#0D3B1A',

    # === Stare plave -> Zelene ===
    '#4274D9': '#1A5C2A',
    '#293681': '#0D3B1A',
    '#D10024': '#1A5C2A',
    '#171E45': '#0D3B1A',
    '#171e45': '#0D3B1A',
    '#1E2756': '#0D3B1A',
    '#1e2756': '#0D3B1A',
    '#1A2050': '#0D3B1A',
    '#1a2050': '#0D3B1A',
    '#1E2D42': '#0D3B1A',
    '#1e2d42': '#0D3B1A',
    '#2B2D42': '#0D3B1A',
    '#2b2d42': '#0D3B1A',
    '#2D3E57': '#0D3B1A',
    '#2d3e57': '#0D3B1A',
    '#2C4D63': '#0D3B1A',
    '#3355C7': '#1A5C2A',
    '#4169B8': '#1A5C2A',
    '#4169D9': '#1A5C2A',
    '#4A5F7F': '#0D3B1A',
    '#416D8C': '#1A5C2A',
    '#5561C9': '#1A5C2A',
    '#5592E8': '#1A5C2A',
    '#5A67D8': '#1A5C2A',
    '#5A7FD7': '#1A5C2A',
    '#6674E3': '#1A5C2A',
    '#667EEA': '#1A5C2A',
    '#6BAEF9': '#1A5C2A',
    '#764BA2': '#0D3B1A',
    '#7B8BF5': '#1A5C2A',
    '#38B2AC': '#2E7D42',
    '#D4145A': '#1A5C2A',
    '#FBB03B': '#C8A84B',
    '#0D7377': '#1A5C2A',
    '#C3110C': '#1A5C2A',
    '#28A745': '#2E7D42',
    '#3DAB6A': '#2E7D42',

    # === Stare granice i pozadine -> Nove ===
    '#E0E0E0': '#E8D8B0',  # Stari border grey -> Novi border (krem-zlatni)
    '#E4E7ED': '#E8D8B0',
    '#E5E9ED': '#E8D8B0',
    '#E5E5E5': '#E8D8B0',
    '#E5E7EB': '#E8D8B0',
    '#EAECF0': '#E8D8B0',
    '#CBD0DD': '#E8D8B0',
    '#DDE5F5': '#F8F0DC',
    '#DDE1E6': '#E8D8B0',
    '#E8ECF1': '#E8D8B0',
    '#E8EEF8': '#F8F0DC',
    '#EDF0F3': '#F8F0DC',
    '#EEF2FA': '#F8F0DC',
    '#D0D5DB': '#E8D8B0',
    '#F1F3F5': '#F8F0DC',

    # === Stara alternativna pozadina -> Nova krem ===
    '#F4F4F4': '#F8F0DC',  # Light grey -> Svjetla krem
    '#F8F8F8': '#F8F0DC',
    '#F5F5F5': '#F8F0DC',
    '#F5F7FA': '#F8F0DC',
    '#F0F0F0': '#F8F0DC',
    '#F0F4FF': '#F8F0DC',
    '#F0F2F5': '#F8F0DC',
    '#F8F9FA': '#F8F0DC',
    '#FBFBFC': '#FFFFFF',
    '#FAFAFA': '#FFFFFF',
    '#FAFBFC': '#FFFFFF',
    '#FAFCFD': '#FFFFFF',

    # === Muted tekst -> Zelena nijansa ===
    '#777777': '#5A7A5E',  # Siva -> Prigušena zelena
    '#B9BABC': '#5A7A5E',
    '#8D99AE': '#5A7A5E',
    '#6B7280': '#5A7A5E',
    '#5A6C7D': '#5A7A5E',

    # === Ostalo ===
    '#280905': '#0D3B1A',
    '#740A03': '#0D3B1A',
}

def should_process_file(filepath):
    if os.path.isdir(filepath):
        return False
    if '.git' in filepath or 'node_modules' in filepath:
        return False
    valid_extensions = ('.css', '.js', '.html', '.md')
    return filepath.endswith(valid_extensions)

def update_colors_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        changes_made = False

        for old_color, new_color in COLOR_MAPPINGS.items():
            if old_color == new_color:
                continue
            for variant in [old_color, old_color.lower(), old_color.upper()]:
                if variant in content:
                    content = content.replace(variant, new_color)
                    changes_made = True

        if changes_made:
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f'✓ Updated: {filepath}')
            return True

        return False

    except Exception as e:
        print(f'✗ Error processing {filepath}: {e}')
        return False

def main():
    print('=' * 60)
    print('FirstCode - Color Update Script')
    print('Paleta iz logoa: Tamno zelena + Krem + Zlatna')
    print('=' * 60)
    print('\nNova paleta:')
    print('  #0D3B1A — Tamno zelena (footer, dark bg, kvadrat iz loga)')
    print('  #1A5C2A — Zelena (primarni akcent, CTA, dugmad)')
    print('  #2E7D42 — Srednja zelena (hover stanja)')
    print('  #C8A84B — Zlatna (borderi, okviri, detalji)')
    print('  #F0E2C0 — Krem (tekst na tamnom, logo slova)')
    print('  #F8F0DC — Svjetla krem (alternativne sekcije)')
    print('  #0A1F0D — Skoro crna (outline, naslovi, tekst)')
    print('  #5A7A5E — Prigušena zelena (muted tekst)')
    print('  #E8D8B0 — Svjetli border (krem-zlatni)')
    print('  #FFFFFF — Bijela (glavna pozadina)')
    print('\nColor mappings:')
    for old, new in COLOR_MAPPINGS.items():
        if old != new:
            print(f'  {old} → {new}')
    print('\n' + '=' * 60)
    print('Processing files...\n')

    root_dir = os.path.dirname(os.path.abspath(__file__))
    files_updated = 0
    files_processed = 0

    for dirpath, dirnames, filenames in os.walk(root_dir):
        if '.git' in dirpath:
            continue
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if should_process_file(filepath):
                files_processed += 1
                if update_colors_in_file(filepath):
                    files_updated += 1

    print('\n' + '=' * 60)
    print(f'Summary:')
    print(f'  Files processed: {files_processed}')
    print(f'  Files updated:   {files_updated}')
    print('=' * 60)
    return 0

if __name__ == '__main__':
    sys.exit(main())
