/* eslint-env jest */
import baseViewModelMapper from '../baseViewModelMapper';

describe('baseViewModelMapper', () => {
  const vmm = baseViewModelMapper;

  it('normalizes _id to id', () => {
    expect(vmm({ _id: 1 })).toEqual({ id: 1 });
  });

  it('deserializes timestamps', () => {
    const ts = Date.now();
    const date = new Date(ts);
    expect(vmm({ createdAt: ts, updatedAt: ts })).toEqual({ createdAt: date, updatedAt: date });
  });
});
