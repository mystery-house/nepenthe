/**
 * This error is thrown when an unrecognized value is passed to the 
 * `mode` attribute of a `part` tag in a Nepenthe document.
 */
export class UnrecognizedModeError extends Error {
    constructor(message: string) {
        super(message);
       // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;
       // This clips the constructor invocation from the stack trace.
       // It's not absolutely essential, but it does make the stack trace a little nicer.
       //  @see Node.js reference (bottom)
        Error.captureStackTrace(this, this.constructor);
      }
}
