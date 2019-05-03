import React from 'react';
import PropTypes from 'prop-types';
import { Spinner, Modal } from '../ui/components';

const ExportModal = ({ className, handleCancel, show }) => (
  <Modal className={className} title="Exporting..." show={show} onCancel={handleCancel}>
    <div className="export-modal__progress">
      <div className="export-modal__progress">
        {/* TODO: progress */}
        <Spinner small />
      </div>
    </div>
  </Modal>
);

ExportModal.propTypes = {
  className: PropTypes.string,
  handleCancel: PropTypes.func.isRequired,
  show: PropTypes.bool,
};

ExportModal.defaultProps = {
  className: null,
  show: false,
};

export default ExportModal;
