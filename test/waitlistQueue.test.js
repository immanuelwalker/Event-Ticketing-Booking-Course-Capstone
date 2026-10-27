import { test } from "node:test";
import assert from "node:assert/strict";
import { Queue } from "../src/domain/waitlistQueue.js";

test("dequeue returns people in first-in-first-out order", () => {
  const queue = new Queue();
  queue.enqueue("Bola");
  queue.enqueue("Ngozi");
  queue.enqueue("Tunde");

  assert.equal(queue.dequeue(), "Bola");
  assert.equal(queue.dequeue(), "Ngozi");
  assert.equal(queue.dequeue(), "Tunde");
});

test("peek shows the front without removing it", () => {
  const queue = new Queue();
  queue.enqueue("Bola");
  queue.enqueue("Ngozi");

  assert.equal(queue.peek(), "Bola");
  assert.equal(queue.size, 2);
});

test("size goes up and down correctly", () => {
  const queue = new Queue();
  assert.equal(queue.size, 0);
  queue.enqueue("A");
  queue.enqueue("B");
  assert.equal(queue.size, 2);
  queue.dequeue();
  assert.equal(queue.size, 1);
});

test("an empty queue returns undefined and does not crash", () => {
  const queue = new Queue();
  assert.equal(queue.dequeue(), undefined);
  assert.equal(queue.peek(), undefined);
  assert.equal(queue.size, 0);
});

test("EDGE CASE: enqueue after emptying the queue still works (tail reset bug)", () => {
  const queue = new Queue();
  queue.enqueue("First");
  queue.dequeue(); // queue is now empty
  queue.enqueue("Second");
  queue.enqueue("Third");

  assert.equal(queue.size, 2);
  assert.equal(queue.dequeue(), "Second");
  assert.equal(queue.dequeue(), "Third");
});