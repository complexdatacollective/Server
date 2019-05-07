/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import { UnwrappedServerPanel as ServerPanel } from '../ServerPanel';

const mockHostname = 'mock-host.local';

const mockApiResponse = {
  deviceApiPort: 99999,
  hostname: mockHostname,
  publicAddresses: ['x.x.x.x'],
  uptime: 1,
  publicKey: 'abc',
};

const mockServerState = {
  ...mockApiResponse,
};

const mockApiClient = {
  get: jest.fn().mockResolvedValue({ serverStatus: mockApiResponse }),
};

describe('<ServerPanel />', () => {
  it('renders panel items', () => {
    const serverPanel = shallow(<ServerPanel serverOverview={mockServerState} />);
    expect(serverPanel.find('PanelItem').length).toBeGreaterThan(1);
  });

  it('updates status on update', () => {
    const serverPanel = shallow(<ServerPanel />);
    const instance = serverPanel.instance();
    jest.spyOn(instance, 'getServerHealth');
    serverPanel.setProps({});
    expect(instance.getServerHealth).toHaveBeenCalled();
  });

  it('loads status from API', () => {
    const serverPanel = shallow(<ServerPanel apiClient={mockApiClient} />);
    serverPanel.instance().getServerHealth();
    expect(mockApiClient.get).toHaveBeenCalledWith('/health');
  });
});
