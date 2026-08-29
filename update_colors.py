#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Color Update Script - Rebranding 15.0 (Tech/Retail - Red+Blue+Black)
Full mapping from main branch actual colors to new palette.

New palette:
  #C8102E — red primary (CTA, buttons, categories, search icon, badges)
  #E52E3D — red hover/highlight
  #0084B4 — blue secondary (logo accent, tech elements)
  #0A0A0A — black (header bg, sections, footer)
  #FFFFFF — white (content bg, text on dark, search field)
  #F4F4F4 — light grey (alt sections, table rows)
  #E0E0E0 — border grey
  #777777 — muted text
"""

import os
import sys

COLOR_MAPPINGS = {
    # === Main branch blues (primary) -> Red ===
    '#4274D9': '#C8102E',
    '#3355C7': '#C8102E',
    '#4169B8': '#C8102E',
    '#4169D9': '#C8102E',
    '#5561C9': '#C8102E',
    '#5592E8': '#C8102E',
    '#5A67D8': '#C8102E',
    '#5A7FD7': '#C8102E',
    '#6674E3': '#C8102E',
    '#667EEA': '#C8102E',
    '#6BAEF9': '#C8102E',
    '#7B8BF5': '#C8102E',
    '#38B2AC': '#0084B4',  # Teal -> Blue secondary
    '#D4145A': '#C8102E',  # Pink/red -> Red
    '#FBB03B': '#C8102E',  # Amber -> Red

    # === Dark blues (backgrounds) -> Black ===
    '#293681': '#0A0A0A',
    '#171E45': '#0A0A0A',
    '#171e45': '#0A0A0A',
    '#1E2756': '#0A0A0A',
    '#1e2756': '#0A0A0A',
    '#1A2050': '#0A0A0A',
    '#1a2050': '#0A0A0A',
    '#1E2D42': '#0A0A0A',
    '#1e2d42': '#0A0A0A',
    '#2B2D42': '#0A0A0A',
    '#2b2d42': '#0A0A0A',
    '#2D3E57': '#0A0A0A',
    '#2d3e57': '#0A0A0A',
    '#4A5F7F': '#0A0A0A',
    '#764BA2': '#0A0A0A',  # Purple -> Black

    # === Greens -> Red ===
    '#28A745': '#C8102E',
    '#3DAB6A': '#C8102E',

    # === Amber/yellow -> Red ===
    '#F0A500': '#C8102E',

    # === Mid blue-greys -> Neutral ===
    '#5A6C7D': '#777777',
    '#CBD0DD': '#E0E0E0',
    '#DDE5F5': '#F4F4F4',
    '#DDE1E6': '#E0E0E0',
    '#E8ECF1': '#E0E0E0',
    '#E8EEF8': '#F4F4F4',
    '#EDF0F3': '#F4F4F4',
    '#EEF2FA': '#F4F4F4',
    '#D0D5DB': '#E0E0E0',
    '#E4E7ED': '#E0E0E0',
    '#E5E9ED': '#E0E0E0',
    '#E5E5E5': '#E0E0E0',
    '#F1F3F5': '#F4F4F4',

    # === Background whites/greys -> Unified ===
    '#FBFBFC': '#FFFFFF',
    '#FAFAFA': '#FFFFFF',
    '#FAFBFC': '#FFFFFF',
    '#FAFCFD': '#FFFFFF',
    '#F8F8F8': '#F4F4F4',
    '#F5F5F5': '#F4F4F4',
    '#F5F7FA': '#F4F4F4',
    '#F0F0F0': '#F4F4F4',
    '#F0F4FF': '#F4F4F4',
    '#F1F1F1': '#F4F4F4',
    '#B9BABC': '#777777',

    # === Previous Rebranding 14.0 (orange) -> Red ===
    '#F05A22': '#C8102E',
    '#FF6B35': '#E52E3D',
    '#1A1A1A': '#0A0A0A',

    # === All other previous rebranding safety net ===
    '#212121': '#0A0A0A',
    '#323232': '#0A0A0A',
    '#0D7377': '#0084B4',
    '#C3110C': '#C8102E',
    '#EAECF0': '#E0E0E0',
    '#333333': '#0A0A0A',
    '#8D99AE': '#777777',
    '#280905': '#0A0A0A',
    '#740A03': '#0A0A0A',
    '#E6501B': '#E52E3D',
    '#1C2024': '#0A0A0A',
    '#0F1E28': '#0A0A0A',
    '#2C4D63': '#0A0A0A',
    '#416D8C': '#0084B4',
    '#E87722': '#C8102E',
    '#6B7280': '#777777',
    '#E5E7EB': '#E0E0E0',
    '#F8F9FA': '#F4F4F4',
    '#F0F2F5': '#F4F4F4',
    '#D10024': '#C8102E',
    '#4274d9': '#C8102E',
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
    print('Optimus Rebranding 15.0 - Color Update Script')
    print('Tech/Retail — Red / Blue / Black / White')
    print('=' * 60)
    print('\nNew palette:')
    print('  #C8102E — Red primary (CTA, categories, search, badges)')
    print('  #E52E3D — Red hover/highlight')
    print('  #0084B4 — Blue secondary (logo accent, tech elements)')
    print('  #0A0A0A — Black (header, sections, footer)')
    print('  #FFFFFF — White (content bg, text on dark)')
    print('  #F4F4F4 — Light grey (alt sections, table rows)')
    print('  #E0E0E0 — Border grey')
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
