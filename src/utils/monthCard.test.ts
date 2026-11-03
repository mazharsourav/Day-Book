/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMonthCard, monthCardSummary, SHARE_CARD } from './monthCard';

// September 2026 starts on a Tuesday and has 30 days.
const SEPT = { year: 2026, month: 8 };
const AFTER = '2026-10-13';

function ritual(...dates: string[]) {
  return { completedDates: dates };
}

test('a Tuesday start leaves two empty cells, and the month has all its days', () => {
  const model = buildMonthCard([], SEPT, AFTER);
  assert.equal(model.leading, 2);
  assert.equal(model.days.length, 30);
  assert.equal(model.days[0].day, 1);
  assert.equal(model.days[29].day, 30);
});

test('all, some and none follow how many rituals were taken that day', () => {
  const rituals = [ritual('2026-09-01', '2026-09-02'), ritual('2026-09-01')];
  const { days } = buildMonthCard(rituals, SEPT, AFTER);
  assert.equal(days[0].state, 'all');
  assert.equal(days[1].state, 'some');
  assert.equal(days[2].state, 'none');
});

test('with no rituals no day counts as all', () => {
  const { days } = buildMonthCard([], SEPT, AFTER);
  assert.ok(days.every((d) => d.state === 'none'));
});

test('days after today are future, and today itself is not', () => {
  const rituals = [ritual('2026-09-10')];
  const { days } = buildMonthCard(rituals, SEPT, '2026-09-10');
  assert.equal(days[9].state, 'all');
  assert.equal(days[10].state, 'future');
  assert.equal(days[8].state, 'none');
});

test('doses count every taken day in the month and ignore other months', () => {
  const rituals = [ritual('2026-09-01', '2026-09-02', '2026-08-31', '2026-10-01'), ritual('2026-09-30')];
  assert.equal(buildMonthCard(rituals, SEPT, AFTER).doses, 3);
});

test('a month that starts on Sunday has no empty cells', () => {
  // March 2026 starts on a Sunday.
  assert.equal(buildMonthCard([], { year: 2026, month: 2 }, AFTER).leading, 0);
});

test('a month that starts on Monday has one empty cell', () => {
  // June 2026 starts on a Monday.
  assert.equal(buildMonthCard([], { year: 2026, month: 5 }, AFTER).leading, 1);
});

test('a month that starts on Saturday has six empty cells', () => {
  // August 2026 starts on a Saturday.
  assert.equal(buildMonthCard([], { year: 2026, month: 7 }, AFTER).leading, 6);
});

test('leap February has 29 days', () => {
  assert.equal(buildMonthCard([], { year: 2028, month: 1 }, '2028-03-01').days.length, 29);
});

test('the card keeps clear of the bars Instagram lays over a Story', () => {
  // The picture is 1080 by 1920. Sizes on the card are in hundredths of its width.
  const width = 1080;
  const height = 1920;
  const u = width / 100;
  assert.equal(SHARE_CARD.padY, 22);
  assert.equal(SHARE_CARD.padX, 7);
  // At least 12 percent of the height above the title and below the logo.
  assert.ok((SHARE_CARD.padY * u) / height >= 0.12);
  // Seven dots and six gaps fill the width between the side margins.
  const cell = (SHARE_CARD.dotsWidth * u - 6 * SHARE_CARD.gap * u) / 7;
  assert.ok(7 * cell + 6 * SHARE_CARD.gap * u <= width - 2 * SHARE_CARD.padX * u + 0.001);
  assert.deepEqual(
    { title: SHARE_CARD.title, summary: SHARE_CARD.summary, number: SHARE_CARD.number, logo: SHARE_CARD.logo, mark: SHARE_CARD.mark },
    { title: 9, summary: 4.2, number: 3.7, logo: 10, mark: 4.4 }
  );
});

test('the summary line uses singular and plural words', () => {
  assert.equal(monthCardSummary({ ritualCount: 4, doses: 106 }), '4 rituals, 106 doses taken');
  assert.equal(monthCardSummary({ ritualCount: 1, doses: 1 }), '1 ritual, 1 dose taken');
  assert.equal(monthCardSummary({ ritualCount: 0, doses: 0 }), '0 rituals, 0 doses taken');
});
