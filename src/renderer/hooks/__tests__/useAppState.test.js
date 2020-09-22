/* eslint-env jest */

import { mockDispatch as dispatch } from 'react-redux';
import { actionCreators } from '../../ducks/modules/app';
import useAppState from '../useAppState';

const mockState = {
  app: {
    stateKey: 'stateValue',
  },
};

jest.mock('react-redux', () => {
  const mockDispatch = jest.fn();

  return {
    useSelector: jest.fn(fn => fn(mockState)),
    useDispatch: () => mockDispatch,
    mockDispatch,
  };
});

describe('useAppState', () => {
  it('gets state path', () => {
    const [subject] = useAppState('stateKey');
    expect(subject).toBe('stateValue');
  });

  it('updates state path', () => {
    const [, update] = useAppState('stateKey');
    update('newStateValue');
    expect(dispatch.mock.calls[0][0])
      .toEqual(actionCreators.updateSettings({ stateKey: 'newStateValue' }));
  });
});
