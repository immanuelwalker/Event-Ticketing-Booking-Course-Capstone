// A first-in-first-out (FIFO) queue, built as a linked list.
//
// Picture people standing in a line:
//
//   head                      tail
//    [Bola] -> [Ngozi] -> [Tunde] -> null
//
// - enqueue adds a person at the TAIL (the back of the line).
// - dequeue removes a person from the HEAD (the front of the line).
//
// Each box is a Node holding a value and a pointer to the next node.
// Because we keep a pointer to BOTH ends, adding at the back and removing
// from the front each take the same small, fixed amount of work no matter how
// long the line is. That is O(1).
//
// Why not just use an array with array.shift()?
// shift() removes the first item and then slides EVERY other item one place
// to the left. With 100,000 people waiting, that is 100,000 moves for one
// removal. That is O(n). A linked list never moves anyone.

class QueueNode {
  value;
  next = null;

  constructor(value) {
    this.value = value;
  }
}

export class Queue {
  // The # means private: code outside this class cannot touch these fields.
  // That stops other code from breaking the queue by editing head or tail.
  #head = null;
  #tail = null;
  #size = 0;

  /** Add a value to the back of the line. O(1). */
  enqueue(value) {
    const node = new QueueNode(value);

    if (this.#tail === null) {
      // The line was empty, so the new node is both the front and the back.
      this.#head = node;
      this.#tail = node;
    } else {
      this.#tail.next = node; // the old last person now points at the new one
      this.#tail = node; // and the new one becomes the back of the line
    }

    this.#size += 1;
  }

  /**
   * Remove and return the value at the front of the line. O(1).
   * Returns undefined if the line is empty.
   */
  dequeue() {
    if (this.#head === null) {
      return undefined;
    }

    const node = this.#head;
    this.#head = node.next;

    // THE CLASSIC BUG: if that was the last person, the line is now empty,
    // so tail must be reset too. Without this line, tail would still point at
    // the removed node, and the next enqueue would attach the new person to a
    // node that is no longer in the line, so they would silently vanish.
    if (this.#head === null) {
      this.#tail = null;
    }

    this.#size -= 1;
    return node.value;
  }

  /** Look at the front of the line without removing it. O(1). */
  peek() {
    return this.#head === null ? undefined : this.#head.value;
  }

  /** How many people are waiting. O(1) because we keep a running count. */
  get size() {
    return this.#size;
  }
}