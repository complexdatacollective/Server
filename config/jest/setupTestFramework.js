/* eslint-env jest */
/* eslint-disable prefer-template */

/**
 * Custom matcher for errors: assert that an error's message matches a regex.
 * Relies on jest utils, and so must be called within an `it()` function.
 */
expect.extend({
  toAlwaysPass() {
    // This is useful for asserting that a promise resolves, but we don't care what it resolves to,
    // as `.resolves` by itself adds no assertions.
    // Example: `expect(fn).resolves.toAlwaysPass()`
    return {
      message: 'expected anything or nothing',
      pass: true,
    };
  },
  toMatchErrorMessage(receivedObj, expectedMessage) {
    const {
      matcherHint,
      printExpected,
      printReceived,
      printWithType,
      EXPECTED_COLOR,
      RECEIVED_COLOR,
    } = this.utils;

    if (!receivedObj || typeof receivedObj !== 'object') {
      throw new Error(
        matcherHint('[.not].toContainMessage') +
          '\n\n' +
          `${RECEIVED_COLOR('received')} value must be an object.\n` +
          printWithType('Received', receivedObj, printReceived),
      );
    }

    if (typeof expectedMessage !== 'string') {
      throw new Error(
        matcherHint('[.not].toContainMessage') +
          '\n\n' +
          `${EXPECTED_COLOR('expected')} value must be a string.\n` +
          printWithType('Got', expectedMessage, printExpected),
      );
    }

    const pass = !!(receivedObj &&
          receivedObj.message &&
          receivedObj.message.indexOf(expectedMessage) > -1);

    const matchDesc = pass ? '.not.toMatchError' : '.toMatchError';
    const message = () => (
      matcherHint(matchDesc) +
      '\n\n' +
      `Expected object to ${pass ? 'not ' : ''}have message matching:\n` +
      `  ${printExpected(expectedMessage)}\n` +
      'Received:\n' +
      `  ${printReceived(receivedObj)}`
    );

    return {
      message,
      pass,
    };
  },
});
