// A DomainError is an error that means "a business rule was broken".
// It is different from a bug (like a typo that crashes the program).
//
// Every DomainError carries a `code`: a short, fixed word that code can
// check, such as error.code === "SOLD_OUT". Checking a code is reliable.
// Checking the message text is not, because wording can change.

export const ErrorCodes = Object.freeze({
  VALIDATION: "VALIDATION", // input is missing, the wrong type, or out of range
  NOT_FOUND: "NOT_FOUND", // the event, tier or booking does not exist
  SOLD_OUT: "SOLD_OUT", // not enough seats left
  NOT_SOLD_OUT: "NOT_SOLD_OUT", // tried to join a waitlist while seats remain
  ALREADY_CANCELLED: "ALREADY_CANCELLED", // cancelled the same booking twice
  ALREADY_WAITLISTED: "ALREADY_WAITLISTED", // same person joined the same waitlist twice
});

export class DomainError extends Error {
  /**
   * @param {string} code    one of ErrorCodes
   * @param {string} message a human-readable explanation
   */
  constructor(code, message) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}