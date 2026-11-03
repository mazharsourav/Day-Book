/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contrastRatio, darkColors, lightColors, mixHex } from './Colors';

// The swatches on the design board ("Look and parts"), approved 3 November 2026.
const BOARD = {
  light: {
    ground: '#FFFFFF', surface: '#F3F5F4', line: '#E4E8E6', text: '#14141A',
    muted: '#5E6864', ring: '#7A8581', accent: '#1F5A45', onAccent: '#FFFFFF', tint: '#D9E3DF',
  },
  dark: {
    ground: '#0D1110', surface: '#181D1B', line: '#272E2B', text: '#F3F3F6',
    muted: '#9CA8A3', ring: '#6B7773', accent: '#5CD6A6', onAccent: '#05241A', tint: '#1A322A',
  },
};

test('light colours are the board swatches', () => {
  for (const [key, value] of Object.entries(BOARD.light)) {
    assert.equal(lightColors[key as keyof typeof BOARD.light], value, key);
  }
});

test('dark colours are the board swatches', () => {
  for (const [key, value] of Object.entries(BOARD.dark)) {
    assert.equal(darkColors[key as keyof typeof BOARD.dark], value, key);
  }
});

test('tint is 17 percent accent over the ground, as the board mixes it', () => {
  for (const c of [lightColors, darkColors]) {
    const mixed = mixHex(c.accent, c.ground, 0.17);
    assert.ok(contrastRatio(mixed, c.tint) < 1.02, `${c.scheme}: ${mixed} vs ${c.tint}`);
  }
});

test('mixHex blends two colours', () => {
  assert.equal(mixHex('#000000', '#FFFFFF', 0.5), '#808080');
  assert.equal(mixHex('#1F5A45', '#FFFFFF', 0), '#FFFFFF');
  assert.equal(mixHex('#1F5A45', '#FFFFFF', 1), '#1F5A45');
});

test('contrastRatio matches known values', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#FFFFFF') * 10) / 10, 21);
  assert.equal(contrastRatio('#777777', '#777777'), 1);
});

// The board's "Contrast, measured" table: text needs 4.5 to 1, circle edges need 3 to 1.
test('every pair on the contrast table passes in light and dark', () => {
  for (const c of [lightColors, darkColors]) {
    const todayColumn = mixHex(c.accent, c.ground, 0.13);
    const pairs: [string, string, string, number][] = [
      ['text on the page', c.text, c.ground, 4.5],
      ['muted on the page', c.muted, c.ground, 4.5],
      ['muted on a grey row', c.muted, c.surface, 4.5],
      ["muted on today's tinted column", c.muted, todayColumn, 4.5],
      ['pine on the page', c.accent, c.ground, 4.5],
      ['text on pine', c.onAccent, c.accent, 4.5],
      ['circle edge on the page', c.ring, c.ground, 3],
      ['circle edge on a grey row', c.ring, c.surface, 3],
    ];
    for (const [name, fg, bg, min] of pairs) {
      const ratio = contrastRatio(fg, bg);
      assert.ok(ratio >= min, `${c.scheme}, ${name}: ${ratio.toFixed(2)} is below ${min}`);
    }
  }
});
