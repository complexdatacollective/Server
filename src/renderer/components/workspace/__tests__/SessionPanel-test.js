/* eslint-disable react/jsx-props-no-spreading */
/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { UnconnectedSessionPanel as SessionPanel } from '../SessionPanel';

const mockSessionId = 'session-1';
const mockSessions = [{ id: mockSessionId }];
const dispatchFuncs = {
  deleteSession: jest.fn(),
  deleteAllSessions: jest.fn(),
};
const props = {
  ...dispatchFuncs,
  sessions: mockSessions,
  totalCount: mockSessions.length,
  openDialog: jest.fn(),
};

const mockStore = createStore(() => (
  { dialogs: { dialogs: [] } }
));

describe('<SessionPanel />', () => {
  it('renders a title', () => {
    const subject = mount(
      <HashRouter><Provider store={mockStore}><SessionPanel {...props} /></Provider></HashRouter>,
    );
    expect(subject.text()).toMatch('Most Recent Sessions');
  });

  it('renders sessions', () => {
    const subject = mount(
      <HashRouter>
        <Provider store={mockStore}><SessionPanel {...props} /></Provider>
      </HashRouter>,
    );
    expect(subject.find('.session-panel__list').find('li')).toHaveLength(1);
  });

  it('renders total count if greater than loaded count', () => {
    const mockTotal = 991199;
    const subject = mount(
      <HashRouter>
        <Provider store={mockStore}>
          <SessionPanel {...props} totalCount={mockTotal} />
        </Provider>
      </HashRouter>,
    );
    expect(subject.text()).toContain(`${mockSessions.length} of ${mockTotal}`);
  });

  // TODO: Reinstate these, taking into account confirmation dialog replaced confirm.

  // describe('session deletion', () => {
  //   let confirmSpy;
  //   let subject;

  //   beforeEach(() => {
  //     confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
  //     subject = shallow(<UnconnectedSessionPanel {...props} />);
  //   });

  //   afterEach(() => {
  //     confirmSpy.mockRestore();
  //     dispatchFuncs.deleteSession.mockClear();
  //     dispatchFuncs.deleteAllSessions.mockClear();
  //   });

  //   it('can delete all', () => {
  //     subject.instance().deleteAllSessions();
  //     expect(dispatchFuncs.deleteAllSessions).toHaveBeenCalled();
  //   });

  //   it('can delete one', () => {
  //     subject.instance().deleteSession(mockSessionId);
  //     expect(dispatchFuncs.deleteSession).toHaveBeenCalled();
  //   });

  //   it('requires a sessionId to delete single session', () => {
  //     subject.instance().deleteSession();
  //     expect(dispatchFuncs.deleteSession).not.toHaveBeenCalled();
  //   });

  //   describe('UI', () => {
  //     let instance;

  //     beforeEach(() => {
  //       subject = mount(<Provider store={mockStore}><SessionPanel {...props} /></Provider>);
  //       instance = subject.instance();
  //       jest.spyOn(instance, 'deleteAllSessions');
  //       jest.spyOn(instance, 'deleteSession');
  //     });

  //     it('provides a button to delete all', () => {
  //       expect(instance.deleteAllSessions).not.toHaveBeenCalled();
  //       subject.find('.session-panel__header').find('DismissButton').simulate('click');
  //       expect(instance.deleteAllSessions).toHaveBeenCalled();
  //     });

  //     it('provides a button to delete one', () => {
  //       expect(instance.deleteSession).not.toHaveBeenCalled();
  //       subject.find('ul').find('DismissButton').simulate('click');
  //       expect(instance.deleteSession).toHaveBeenCalled();
  //     });
  //   });
  // });
});
