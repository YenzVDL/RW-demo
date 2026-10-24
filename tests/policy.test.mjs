import test from 'node:test';
import assert from 'node:assert/strict';
import {activeAt,isVisible,releaseIssues,amsterdamTime} from '../src/lib/policy.mjs';
test('unapproved text cannot be released through a global production flag',()=>{
  const u={publicationStatus:'publish',editorialStatus:'needs_confirmation'};
  assert.equal(isVisible(u,false),true);assert.equal(isVisible(u,true),false);
  assert.equal(isVisible({...u,editorialStatus:'approved'},true),false);
  assert.equal(isVisible({...u,editorialStatus:'approved',approvedBy:'reviewer',approvedAt:'2026-10-24T12:00:00Z'},true),true);
  assert.ok(releaseIssues([u]).length);
});
test('notices expire at explicit Amsterdam DST boundaries without a publication event',()=>{
  const notice={kind:'notice',startsAt:'2026-10-25T01:30:00+02:00',endsAt:'2026-10-25T02:30:00+01:00'};
  assert.equal(activeAt(notice,'2026-10-24T23:29:59Z'),false);
  assert.equal(activeAt(notice,'2026-10-25T00:45:00Z'),true);
  assert.equal(activeAt(notice,'2026-10-25T01:30:00Z'),false);
  assert.equal(activeAt({...notice,endsAt:'2026-10-25T02:30:00'},'2026-10-25T01:00:00Z'),false);
  assert.equal(activeAt({kind:'notice'},'2026-10-25T00:00:00Z'),false);
  assert.match(amsterdamTime('2026-07-01T12:00:00Z'),/14:00/);
  assert.match(amsterdamTime('2026-12-01T12:00:00Z'),/13:00/);
});
test('recruitment deadline stops being active at the deadline',()=>{
  const u={kind:'recruitment',deadline:'2026-12-07T23:59:00+01:00'};
  assert.equal(activeAt(u,'2026-12-07T22:58:59Z'),true);
  assert.equal(activeAt(u,'2026-12-07T22:59:00Z'),false);
});
