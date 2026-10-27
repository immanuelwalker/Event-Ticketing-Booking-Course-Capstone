import { randomUUID, randomInt } from "node:crypto";

// newId() makes an internal identifier, such as "3b241101-e2bb-4255-8caf-...".
// Nobody reads these aloud. They only need to be unique and hard to guess.
export function newId() {
  return randomUUID();
}

// newReference() makes the short code an attendee sees on their ticket and
// might read over the phone, such as "K7M2-9QXP".
//
// The alphabet leaves out look-alike characters:
//   0 and O, 1 and I and L
// so nobody has to ask "was that a zero or an oh?".
//
// 31 characters ^ 8 positions is about 852 billion combinations. The store
// still checks for duplicates, because "unlikely" is not "impossible".
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function newReference() {
  let code = "";
  for (let i = 0; i < LENGTH; i++) {
    // randomInt(max) returns 0 up to max - 1. It uses the operating system's
    // secure random source, so references cannot be predicted. Math.random
    // can be predicted, which is why we never use it for codes like this.
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  // Insert a hyphen in the middle so it is easier to read and say.
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}