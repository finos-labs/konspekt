import { test } from "node:test";
import assert from "node:assert/strict";
import { foldOrder } from "../order.mjs";

test("foldOrder is arrival (created) order, tiebroken by proposalId", () => {
  const items = [
    { proposalId: "b", created: "2026-10-10T12:00:00Z" },
    { proposalId: "a", created: "2026-10-10T10:00:00Z" },
    { proposalId: "a2", created: "2026-10-10T10:00:00Z" },
  ];
  assert.deepEqual(foldOrder(items).map((i) => i.proposalId), ["a", "a2", "b"]);
});

test("foldOrder does not mutate its input", () => {
  const items = [{ proposalId: "b", created: "2" }, { proposalId: "a", created: "1" }];
  foldOrder(items);
  assert.equal(items[0].proposalId, "b");
});
