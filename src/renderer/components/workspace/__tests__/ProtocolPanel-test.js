/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { mockProtocol } from '../../../../../config/jest/setupTestEnv';

import ProtocolPanel from '../ProtocolPanel';

describe('ProtocolPanel', () => {
  it('renders a protocol name', () => {
    const wrapper = shallow(<ProtocolPanel workspaceId="workspace-id" protocol={mockProtocol} />)
      .find('ProtocolCard').dive();
    expect(wrapper.text()).toContain(mockProtocol.name);
  });
});
