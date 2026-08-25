#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Color Update Script - Rebranding 14.0 (Clean Tech / Trim Style)
Minimalist: white background, dark text, orange accent only.

Replaces actual main-branch colors (deep blue palette) with:
  #F05A22 — orange (CTA, buttons, prices, badges)
  #FF6B35 — orange hover
  #1A1A1A — dark (nav, headings, logo, footer)
  #111111 — deeper dark (footer bottom)
  #F4F4F4 — light grey (alt sections, table rows)
  #E0E0E0 — border grey
  #FFFFFF — white (main bg, nav bg)
  #777777 — muted text
"""

import os
import sys

COLOR_MAPPINGS = {
    # === Deep blue (primary/accent) -> Orange ===
    '#4274D9': '#F05A22',  # Blue primary -> Orange
    '#293681': '#1A1A1A',  # Dark blue header -> Dark
    '#D10024': '#F05A22',  # Red accent -> Orange

    # === Very dark blues (backgrounds) -> Dark ===
    '#171E45': '#1A1A1A',
    '#171e45': '#1A1A1A',
    '#1E2756': '#1A1A1A',
    '#1e2756': '#1A1A1A',
    '#1A2050': '#1A1A1A',
    '#1a2050': '#1A1A1A',
    '#1E2D42': '#1A1A1A',
    '#1e2d42': '#1A1A1A',
    '#2B2D42': '#1A1A1A',
    '#2b2d42': '#1A1A1A',
    '#2D3E57': '#1A1A1A',
    '#2d3e57': '#1A1A1A',

    # === Filter gradient blues/purples -> Orange or Dark ===
    '#3355C7': '#F05A22',  # Blue -> Orange
    '#4169B8': '#F05A22',
    '#4169D9': '#F05A22',
    '#4A5F7F': '#1A1A1A',
    '#5561C9': '#F05A22',
    '#5592E8': '#F05A22',
    '#5A67D8': '#F05A22',
    '#5A7FD7': '#F05A22',
    '#6674E3': '#F05A22',
    '#667EEA': '#F05A22',
    '#6BAEF9': '#F05A22',
    '#764BA2': '#1A1A1A',  # Purple -> Dark
    '#7B8BF5': '#F05A22',
    '#38B2AC': '#F05A22',  # Teal -> Orange
    '#D4145A': '#F05A22',  # Pink/red -> Orange
    '#FBB03B': '#F05A22',  # Amber -> Orange

    # === Mid blues -> Dark or Orange ===
    '#5A6C7D': '#777777',  # Mid blue-grey -> Muted
    '#CBD0DD': '#E0E0E0',  # Light blue-grey -> Border grey
    '#DDE5F5': '#F4F4F4',  # Light blue tint -> Light grey
    '#DDE1E6': '#E0E0E0',
    '#E8ECF1': '#E0E0E0',
    '#E8EEF8': '#F4F4F4',
    '#EDF0F3': '#F4F4F4',
    '#EEF2FA': '#F4F4F4',
    '#D0D5DB': '#E0E0E0',
    '#E4E7ED': '#E0E0E0',  # Border grey -> New border grey
    '#E5E9ED': '#E0E0E0',
    '#E5E5E5': '#E0E0E0',
    '#F1F3F5': '#F4F4F4',

    # === Greens -> Orange (sale/promo accents) ===
    '#28A745': '#F05A22',
    '#3DAB6A': '#F05A22',

    # === Amber/yellow accent -> Orange ===
    '#F0A500': '#F05A22',

    # === Background greys -> Unified ===
    '#FBFBFC': '#FFFFFF',
    '#FAFAFA': '#FFFFFF',
    '#FAFBFC': '#FFFFFF',
    '#FAFCFD': '#FFFFFF',
    '#F8F8F8': '#F4F4F4',
    '#F5F5F5': '#F4F4F4',
    '#F5F7FA': '#F4F4F4',
    '#F0F0F0': '#F4F4F4',
    '#F0F4FF': '#F4F4F4',
    '#F4F4F4': '#F4F4F4',  # keep

    # === Muted text ===
    '#777777': '#777777',  # keep
    '#B9BABC': '#777777',

    # === Old rebranding safety net ===
    '#212121': '#1A1A1A',
    '#323232': '#1A1A1A',
    '#0D7377': '#F05A22',
    '#C3110C': '#F05A22',
    '#EAECF0': '#E0E0E0',
    '#333333': '#1A1A1A',
    '#8D99AE': '#777777',
    '#280905': '#1A1A1A',
    '#740A03': '#1A1A1A',
    '#E6501B': '#F05A22',
    '#0A0A0A': '#1A1A1A',
    '#1C2024': '#1A1A1A',
    '#0F1E28': '#1A1A1A',
    '#2C4D63': '#1A1A1A',
    '#416D8C': '#F05A22',
    '#E87722': '#F05A22',
    '#6B7280': '#777777',
    '#E5E7EB': '#E0E0E0',
    '#F8F9FA': '#F4F4F4',
    '#F0F2F5': '#F4F4F4',
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
    print('Optimus Rebranding 14.0 - Color Update Script')
    print('Clean Tech / Trim Style — White + Orange')
    print('=' * 60)
    print('\nNew palette:')
    print('  #F05A22 — Orange (CTA, buttons, prices, badges)')
    print('  #FF6B35 — Orange hover')
    print('  #1A1A1A — Dark (nav, headings, logo, footer)')
    print('  #F4F4F4 — Light grey (alt sections, table rows)')
    print('  #E0E0E0 — Border grey')
    print('  #FFFFFF — White (main bg, nav bg)')
    print('  #777777 — Muted text')
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
