/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fromWheel, timeLabel, toWheel, wheelColumns } from './timeFormat';

test('12 hour labels, as the board shows', () => {
  assert.equal(timeLabel({ hour: 20, minute: 0 }, false), '8:00 PM');
  assert.equal(timeLabel({ hour: 8, minute: 0 }, false), '8:00 AM');
  assert.equal(timeLabel({ hour: 0, minute: 0 }, false), '12:00 AM');
  assert.equal(timeLabel({ hour: 12, minute: 5 }, false), '12:05 PM');
  assert.equal(timeLabel({ hour: 23, minute: 55 }, false), '11:55 PM');
});

test('24 hour labels', () => {
  assert.equal(timeLabel({ hour: 20, minute: 0 }, true), '20:00');
  assert.equal(timeLabel({ hour: 8, minute: 0 }, true), '08:00');
  assert.equal(timeLabel({ hour: 0, minute: 5 }, true), '00:05');
});

test('wheel columns: hours, every minute, and AM/PM only for 12 hour', () => {
  const twelve = wheelColumns(false);
  assert.deepEqual(twelve.hours, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(twelve.minutes.length, 60);
  assert.equal(twelve.minutes[0], 0);
  assert.equal(twelve.minutes[7], 7);
  assert.equal(twelve.minutes[59], 59);
  assert.equal(twelve.periods, true);
  const day = wheelColumns(true);
  assert.equal(day.hours.length, 24);
  assert.equal(day.hours[0], 0);
  assert.equal(day.hours[23], 23);
  assert.equal(day.periods, false);
});

test('a time goes onto the wheel and back unchanged', () => {
  for (const uses24 of [false, true]) {
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 1, 7, 30, 59]) {
        assert.deepEqual(fromWheel(toWheel({ hour, minute }, uses24), uses24), { hour, minute });
      }
    }
  }
});

test('12 hour wheel positions for midnight, noon and evening', () => {
  assert.deepEqual(toWheel({ hour: 0, minute: 0 }, false), { hour: 12, minute: 0, pm: false });
  assert.deepEqual(toWheel({ hour: 12, minute: 0 }, false), { hour: 12, minute: 0, pm: true });
  assert.deepEqual(toWheel({ hour: 20, minute: 0 }, false), { hour: 8, minute: 0, pm: true });
});

test('any minute can be chosen (Mazhar, 3 November 2026; the board drew fives)', () => {
  assert.equal(toWheel({ hour: 7, minute: 32 }, true).minute, 32);
  assert.equal(toWheel({ hour: 7, minute: 58 }, false).minute, 58);
  assert.equal(timeLabel({ hour: 15, minute: 7 }, false), '3:07 PM');
});
