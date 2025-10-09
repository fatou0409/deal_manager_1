// src/utils/diff.js
export function computeDiff(oldObj, newObj, fields) {
const changes = {};
for (const key of fields) {
if (key in newObj) {
const before = oldObj[key];
const after = newObj[key];
const same = JSON.stringify(before) === JSON.stringify(after);
if (!same) changes[key] = { before, after };
}
}
return changes;
}