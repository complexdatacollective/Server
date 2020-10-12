/* eslint-env jest */
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import useAdminClient from '../../../hooks/useAdminClient';
import { ExportScreen } from '../ExportScreen';

jest.mock('react-router-dom');
jest.mock('electron');
jest.mock('../../../hooks/useAdminClient', () => {
  const exportToFile = jest.fn(() => Promise.resolve());

  return () => ({
    exportToFile,
  });
});

const mockStore = createStore(() => ({
}));

const render = (props = {}, store = mockStore) => (
  <Provider store={store}>
    <ExportScreen {...props} />
  </Provider>
);

const createdAt = new Date(1540000000000);
const protocol = { id: '1', name: '1', createdAt };

const validProps = {
  history: {},
  protocol,
  showConfirmation: jest.fn(),
  showError: jest.fn(),
  protocolsHaveLoaded: true,
};

describe('<ExportScreen />', () => {
  it('renders', () => {
    mount(render(validProps));
  });

  it('should render a spinner before protocol loaded', () => {
    const subject = mount(render({ ...validProps, protocol: null, protocolsHaveLoaded: false }));
    expect(subject.find('Spinner')).toHaveLength(1);
  });

  it('redirects if protocol not found', () => {
    const subject = mount(render({ ...validProps, protocol: null, protocolsHaveLoaded: true }));
    expect(subject.find('Redirect')).toHaveLength(1);
  });

  describe('once protocol loaded', () => {
    const { exportToFile } = useAdminClient();
    let subject;

    beforeEach(() => {
      subject = mount(render(validProps));
    });

    it('renders an export button', () => {
      expect(subject.find('Button[type="submit"]')).toHaveLength(1);
      expect(subject.find('Button[type="submit"]').html()).toMatch(/export/i);
    });

    it('when csv is selected set object otherwise false', async () => {
      expect.assertions(2);
      await act(async () => {
        subject.find('form').simulate('submit');
      });
      expect(exportToFile.mock.calls[0][1].exportCSV).toEqual(
        expect.objectContaining({
          adjacencyMatrix: expect.any(Boolean),
          attributeList: expect.any(Boolean),
          edgeList: expect.any(Boolean),
          egoAttributeList: expect.any(Boolean),
        }),
      );
      await act(async () => {
        const radioWrapper = subject.findWhere(n => n.name() === 'Checkbox' && n.prop('label') === 'CSV');
        radioWrapper.find('input').simulate('click');
        subject.find('form').simulate('submit');
      });
      expect(exportToFile.mock.calls[0][1].exportCSV).toEqual(
        expect.objectContaining({
          adjacencyMatrix: expect.any(Boolean),
          attributeList: expect.any(Boolean),
          edgeList: expect.any(Boolean),
          egoAttributeList: expect.any(Boolean),
        }),
      );
    });
  });
});
