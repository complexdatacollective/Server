/* eslint-env jest */

import reducer, { actionTypes } from '../serverSetup';

const mockState = {
  setupComplete: false,
};

describe('server setup reducer', () => {
  it('should return the initial state', () => {
    expect(
      reducer(undefined, {}),
    ).toEqual(mockState);
  });

  it('should handle COMPLETE_SETUP', () => {
    const newState = reducer({
      ...mockState,
    }, {
      type: actionTypes.COMPLETE_SETUP,
    });

    expect(newState.setupComplete).toBe(true);
  });

  it('should handle RESET_SETUP', () => {
    expect(
      reducer({
        ...mockState,
        setupComplete: true,
      }, {
        type: actionTypes.RESET_SETUP,
      }),
    ).toEqual(
      {
        ...mockState,
        setupComplete: false,
      },
    );
  });
});
