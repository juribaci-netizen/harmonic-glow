import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { readParticipation, writeParticipation } from '../lib/schedule-participation'
import { db, pool } from '../lib/db'
import { timeEntry } from '../lib/db/schema'
import { dayValues } from '../lib/epc/model'
import { seasonData } from '../lib/season-data-2026-27'

async function main() {
  if (!process.env.DATABASE_URL?.includes('127.0.0.1:55439')) throw new Error('Requires the isolated local test database.')
  const userId = 'participation-test-' + Date.now()
  const first = seasonData.findIndex(a => a.date === '2026-09-08' && a.startTime === '09:00') + 1
  const second = first + 1
  const rows = () => db.select().from(timeEntry).where(eq(timeEntry.userId, userId))
  try {
    await writeParticipation(userId, second, true)
    await writeParticipation(userId, first, false)
    assert.equal((await readParticipation(userId)).get(first), false)
    assert.equal((await readParticipation(userId + '-other')).size, 0)
    assert.deepEqual(dayValues(await rows(), '2026-09-08', {date:'2026-09-08', minutes:1000}).services, [false, true])
    await writeParticipation(userId, first, true)
    assert.deepEqual(dayValues(await rows(), '2026-09-08', {date:'2026-09-08', minutes:660}).services, [false, false])
    assert.deepEqual(dayValues(await rows(), '2026-09-08', {date:'2026-09-08', minutes:720}).services, [true, false])
    assert.deepEqual(dayValues(await rows(), '2026-09-08', {date:'2026-09-08', minutes:990}).services, [true, true])
    await writeParticipation(userId, second, false)
    await writeParticipation(userId, second, false)
    assert.equal((await rows()).length, 2)
    assert.deepEqual(dayValues(await rows(), '2026-09-08', {date:'2026-09-09', minutes:0}).services, [true, false])
    assert.equal(Number((await rows()).find(row => row.activityId === second)!.hours), 0)
    await assert.rejects(() => writeParticipation(userId, 0, true))
    await assert.rejects(() => writeParticipation(userId, 1, true))
    console.log('PASS: participation persists, preserves both service columns, gates X by end time, restores yes, rejects invalid/off activities, and isolates users.')
  } finally {
    await db.delete(timeEntry).where(eq(timeEntry.userId, userId))
    await pool.end()
  }
}
main().catch(error => {console.error(error);process.exitCode=1})
