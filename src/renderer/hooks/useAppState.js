import { useSelector, useDispatch } from 'react-redux';
import { get } from 'lodash';
import { actionCreators } from '../ducks/modules/app';

const useAppState = (key, defaultState) => {
  const state = useSelector(
    s => get(s, ['app', key], defaultState),
  );

  const dispatch = useDispatch();

  const update = value =>
    dispatch(actionCreators.updateSettings({ [key]: value }));

  return [state, update];
};

export default useAppState;
