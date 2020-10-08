/* eslint-env jest */
import React from 'react';
import { createStore } from 'redux';
import { shallow } from 'enzyme';
import { remote } from 'electron';

import ConnectedExportScreen, { ExportScreen, availableCsvTypes } from '../ExportScreen';

jest.mock('react-router-dom');
jest.mock('electron');

describe('Connected ExportScreen', () => {
  it('provides protocol props', () => {
    const container = <ConnectedExportScreen store={createStore(() => ({}))} />;
    const initialProps = shallow(container).props();
    expect(initialProps).toHaveProperty('protocolsHaveLoaded');
    expect(initialProps).toHaveProperty('protocol');
  });
});

describe('<ExportScreen />', () => {
  const createdAt = new Date(1540000000000);
  let props;

  beforeEach(() => {
    props = { history: {}, protocol: null, showConfirmation: jest.fn(), showError: jest.fn() };
  });

  it('should render a spinner before protocol loaded', () => {
    const subject = shallow(<ExportScreen {...props} protocolsHaveLoaded={false} />);
    expect(subject.find('Spinner')).toHaveLength(1);
  });

  it('redirects if protocol not found', () => {
    const subject = shallow(<ExportScreen {...props} protocolsHaveLoaded />);
    expect(subject.find('Redirect')).toHaveLength(1);
  });

  describe('API client', () => {
    const apiClient = { post: jest.fn().mockResolvedValue({}) };
    const protocol = { id: '1', name: '1', createdAt };

    it('handles export requests', () => {
      props = { ...props, apiClient, protocol, protocolsHaveLoaded: true };
      const subject = shallow(<ExportScreen {...props} />);
      subject.instance().exportToFile('');
      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  describe('once protocol loaded', () => {
    let subject;

    beforeEach(() => {
      const protocol = { id: '1', name: 'mock', createdAt };
      props = { history: {}, protocol, showConfirmation: jest.fn(), showError: jest.fn() };
      subject = shallow((
        <ExportScreen {...props} protocolsHaveLoaded />
      ));
    });

    it('renders an export button', () => {
      expect(subject.find('Button[type="submit"]')).toHaveLength(1);
      expect(subject.find('Button[type="submit"]').html()).toMatch(/export/i);
    });

    it('selects CSV format', () => {
      const radioWrapper = subject.findWhere(n => n.name() === 'Radio' && n.prop('label') === 'CSV');
      radioWrapper.dive().find('input').simulate('change', { target: { value: 'csv' } });
      expect(subject.state('exportFormat')).toEqual('csv');
    });

    it('does not warn about ego data for csv export', () => {
      const radioWrapper = subject.findWhere(n => n.name() === 'Radio' && n.prop('label') === 'CSV');
      radioWrapper.dive().find('input').simulate('change', { target: { value: 'csv' } });
      const toggleWrapper = subject.find('Toggle').at(0);
      expect(toggleWrapper.dive().find('.form-field-toggle').at(0).hasClass('form-field-toggle--disabled')).toBe(false);
    });

    it('selects graphml format', () => {
      const radioWrapper = subject.findWhere(n => n.name() === 'Radio' && n.prop('label') === 'GraphML');
      radioWrapper.dive().find('input').simulate('change', { target: { value: 'graphml' } });
      expect(subject.state('exportFormat')).toEqual('graphml');
    });

    it('warns about ego data not downloading', () => {
      const radioWrapper = subject.findWhere(n => n.name() === 'Radio' && n.prop('label') === 'GraphML');
      radioWrapper.dive().find('input').simulate('change', { target: { value: 'graphml' } });
      const toggleWrapper = subject.find('Toggle').at(0);
      expect(toggleWrapper.dive().find('.form-field-toggle').at(0).hasClass('form-field-toggle--disabled')).toBe(true);
    });

    it('selects a csv type', () => {
      const csvType = 'adjacencyMatrix';
      const checkbox = subject.find('Checkbox').first().dive().find('input');
      expect(availableCsvTypes[csvType]).toBeDefined();
      checkbox.simulate('change', { target: { value: csvType, checked: false } });
      expect(subject.state('csvTypes').has(csvType)).toBe(false);
      checkbox.simulate('change', { target: { value: csvType, checked: true } });
      expect(subject.state('csvTypes').has(csvType)).toBe(true);
    });

    it('toggles union setting', () => {
      const radioWrapper = subject.findWhere(n => n.name() === 'Radio' && (/the union of/).test(n.prop('label')));
      radioWrapper.dive().find('input').simulate('change', { target: { value: 'true' } });
      expect(subject.state('exportNetworkUnion')).toBe(true);
    });

    it('toggles directed edge setting', () => {
      const radioWrapper = subject.findWhere(n => n.name() === 'Toggle' && (/directed/).test(n.prop('label')));
      radioWrapper.dive().find('input').simulate('change', { target: { checked: true } });
      expect(subject.state('useDirectedEdges')).toBe(true);
    });

    it('toggles ego setting', () => {
      const radioWrapper = subject.findWhere(n => n.name() === 'Toggle' && (/Ego/).test(n.prop('label')));
      radioWrapper.dive().find('input').simulate('change', { target: { checked: true } });
      expect(subject.state('useEgoData')).toBe(true);
    });

    it('prompts for output path before export', () => {
      subject.instance().handleExport();
      expect(remote.dialog.showSaveDialog).toHaveBeenCalled();
    });
  });
});