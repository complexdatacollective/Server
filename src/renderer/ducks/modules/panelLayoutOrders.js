import { selectors as protocolSelectors } from './protocols';

const SET_PANEL_LAYOUT_ORDER = 'SET_PANEL_LAYOUT_ORDER';

const initialState = {};

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case SET_PANEL_LAYOUT_ORDER: {
      const protocolId = action.protocolId;
      if (!protocolId) {
        return state;
      }
      return { ...state, [protocolId]: action.layoutOrder };
    }
    default:
      return state;
  }
};

/**
 */
const setPanelLayoutOrder = (protocolId, layoutOrder) => ({
  type: SET_PANEL_LAYOUT_ORDER,
  protocolId,
  layoutOrder,
});


const panelLayoutOrderForCurrentProtocol = (state, props) => {
  const protocol = protocolSelectors.currentProtocol(state, props);
  return (protocol && state.panelLayoutOrders[protocol.id]) || [];
};

const actionCreators = {
  setPanelLayoutOrder,
};

const actionTypes = {
  SET_PANEL_LAYOUT_ORDER,
};

const selectors = {
  panelLayoutOrderForCurrentProtocol,
};

export {
  actionCreators,
  actionTypes,
  selectors,
};

export default reducer;
