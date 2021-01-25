import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Button } from '@codaco/ui';
import states from './states';

const ControlBar = ({
  currentMatch,
  onBack, // previousDiff
  onCancel,
  onClose,
  onFinish,
  onNext, // nextDiff
  isDiffComplete,
  isLoadingMatches,
  status,
  totalMatches,
}) => {
  const totalClasses = cx({ 'resolver__controls-total--indeterminate': isLoadingMatches });

  return (
    <div key="loading-controls" className="resolver__control-bar">
      <div className="resolver__controls resolver__controls--left">
        { status === states.NO_RESULTS &&
          <Button color="white" key="close" onClick={onClose}>Close</Button>
        }
        { status !== states.NO_RESULTS &&
          <Button color="white" key="cancel" onClick={onCancel}>Cancel</Button>
        }
      </div>
      <div className="resolver__controls resolver__controls--center">
        { (status === states.RESOLVING || status === states.WAITING) && (
          <React.Fragment>
            {currentMatch} of&nbsp;<span className={totalClasses}>{totalMatches}</span>
          </React.Fragment>
        )}
      </div>
      <div className="resolver__controls resolver__controls--right">
        { status === states.RESOLVING && currentMatch > 1 &&
          <Button color="white" onClick={onBack}>Back</Button>
        }
        { status === states.RESOLVING &&
          <Button
            disabled={!isDiffComplete}
            onClick={onNext}
          >Next</Button>
        }
        { status === states.REVIEW &&
          <Button onClick={onFinish}>Save and export</Button>
        }
      </div>
    </div>
  );
};

ControlBar.propTypes = {
  currentMatch: PropTypes.number,
  onBack: PropTypes.func.isRequired, // previousDiff
  onCancel: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired, // nextDiff
  isDiffComplete: PropTypes.bool,
  isLoadingMatches: PropTypes.bool,
  status: PropTypes.string,
  totalMatches: PropTypes.number,
};

ControlBar.defaultProps = {
  currentMatch: 0,
  isDiffComplete: false,
  isLoadingMatches: false,
  status: null,
  totalMatches: 0,
};

export default ControlBar;
