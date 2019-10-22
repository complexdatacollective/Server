/* eslint-env jest */
import ReactDOM from 'react-dom';

require('../index');
require('../__mocks__/localStorageMock');

jest.mock('react-dom');

describe('index', () => {
  it('bootstraps the app', () => {
    expect(ReactDOM.render).toHaveBeenCalled();
  });
});
