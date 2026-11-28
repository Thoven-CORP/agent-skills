# Junk patterns

A new test that matches one fails the write gate, and an audit hunts existing tests that do, unless the retention bar in [prune.md](prune.md) names the contract it alone guards. Thoven incidents are in brackets.

- assertion-free coverage probes;
- self-comparisons and identity copiers;
- copied fixtures, inventories, manifests or export lists;
- exact source, import or string greps [`readFileSync('page.tsx')` then `toContain('robots: …')` in the state page guards];
- `className` or Tailwind class-string assertions in place of the compiled CSS or rendered result [four className tests stayed green while the CSS emitted nothing; use the compiled-sheet helper from THV-1014];
- private predicate or call-shape tests duplicated at real boundaries;
- duplicate invocations of one contract, or provider-local replays of shared helpers;
- tests whose only job is keeping test-only exports, globals or wrappers alive, and dead production code whose only callers are tests;
- expected values produced by the helper or renderer under test;
- mocks that implement the asserted behaviour, or one mock standing in for different APIs [a mocked `fetch` returns `xp_awarded: 25`, the test asserts 25; the backend never sent the field];
- a payload key asserted `nil` without asserting the key exists [`expect(json["xp_awarded"]).to be_nil` passes when the key is missing];
- fixtures that supply what the owner should produce, or persistence asserted against a store the path never writes [a hand-built `files_count: 1` for a field the backend never sent];
- capability tests that restate declared flags instead of exercising what the flag promises;
- negative controls that pass for an unrelated reason: a denial from a different guard, a rejection production never reaches, a testid nothing mounts;
- names or fixtures that promise more than the input exercises [a "retires the window" test asserting the window was not cleared];
- a guard or scan tested only on hand-written samples, never on the real files it guards;
- a product flow restated in a unit test: the steps of a journey, copy across screens, a page's layout.
