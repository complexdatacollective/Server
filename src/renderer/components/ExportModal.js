import React from 'react';
import PropTypes from 'prop-types';

import Modal from './Modal';
import Progress from '../ui/components/Progress';

const ExportModal = ({ className, handleCancel, fractionComplete, show }) => (
  <Modal className={className} title="Exporting..." show={show} onCancel={handleCancel}>
    <div className="export-modal__progress">
      <div className="export-modal__progress">
        {
          <Progress max={1} value={fractionComplete} />
        }
      </div>
    </div>
  </Modal>
);

ExportModal.propTypes = {
  className: PropTypes.string,
  fractionComplete: PropTypes.number,
  handleCancel: PropTypes.func.isRequired,
  show: PropTypes.bool,
};

ExportModal.defaultProps = {
  className: null,
  fractionComplete: 0,
  show: false,
};

export default ExportModal;
