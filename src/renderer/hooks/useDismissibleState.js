import { useDispatch, useSelector } from 'react-redux';
import { actionCreators, selectors } from '../ducks/modules/dismissibleState';

const useDismissibleState = (name) => {
  const currentDismissedState = useSelector(selectors.getDismissedState(name));
  const dispatch = useDispatch();

  const dismissItem = (item) => {
    dispatch(actionCreators.dismissItem(item, name));
  };

  return [currentDismissedState, dismissItem];
};

export default useDismissibleState;
