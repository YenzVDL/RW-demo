import test from 'node:test';
import assert from 'node:assert/strict';
import {richtext} from '../src/lib/richtext.ts';
test('legal structure and real links survive; scripts and shortcode markup do not',()=>{
  const html=richtext('<p>Brontekst <strong>met nadruk</strong>.</p><ol><li>Eerste regel</li></ol><script>alert(1)</script><a href="javascript:alert(1)" onclick="steal()">link</a>[vc_row]<iframe src="https://example.invalid"></iframe><a href="/assets/verslag.pdf">Verslag</a>');
  assert.match(html,/<p>Brontekst <strong>met nadruk<\/strong>.<\/p>/);
  assert.match(html,/<ol><li>Eerste regel<\/li><\/ol>/);
  assert.match(html,/href="\/assets\/verslag.pdf"/);
  assert.doesNotMatch(html,/script|onclick|javascript:|iframe|\[vc_row\]/);
});
