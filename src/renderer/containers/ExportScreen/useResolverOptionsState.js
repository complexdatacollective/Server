import { useSelector, useDispatch } from 'react-redux';
import { get } from 'lodash';
import { actionCreators } from '../../ducks/modules/app';

const initialState = {
  args: '--minimumThreshold=0.99',
  egoCastType: '4aebf73e-95e3-4fd1-95e7-237dcc4a4466',
  interpreterPath: 'python3',
  resolverPath: '',
};

const useResolverOptionsState = () => {
  const state = useSelector(
    s => get(s, ['app', 'resolverOptions'], initialState),
  );

  const dispatch = useDispatch();

  const handlers = {
    updateResolverOptions: resolverOptions =>
      dispatch(actionCreators.updateSettings({ resolverOptions })),
  };

  return [state, handlers];
};

export default useResolverOptionsState;
