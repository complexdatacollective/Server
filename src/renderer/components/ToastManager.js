import { connect } from 'react-redux';
import { compose } from 'redux';
import { ToastManager as UIToastManager } from '@codaco/ui';
import { actionCreators as toastActions } from '../ducks/modules/toasts';

const mapStateToProps = state => ({
  toasts: state.toasts,
});

const mapDispatchToProps = {
  removeToast: toastActions.removeToast,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(UIToastManager);

