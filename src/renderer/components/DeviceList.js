import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Text } from '@codaco/ui/lib/components/Fields';
import { Scroller } from '@codaco/ui/lib/components';
import DeviceCard from './DeviceCard';
import { actionCreators } from '../ducks/modules/devices';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';

const containerVariants = {
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      when: 'beforeChildren',
    },
  },
  hide: {
    opacity: 0,
    transition: {
      when: 'afterChildren',
    },
  },
};

const itemVariants = {
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
    },
  },
  hide: {
    opacity: 0,
    y: 25,
    transition: {
      type: 'spring',
    },
  },
};

const DeviceList = ({
  devices,
  deleteDevice,
  openDialog,
}) => {
  const [filterTerm, setFilterTerm] = useState('');

  const onFilterChange = ({ target: { value } }) => setFilterTerm(value);

  const confirmDelete = (deviceId) => {
    if (deleteDevice) { // eslint-disable-line no-alert
      openDialog({
        type: 'Confirm',
        title: 'Remove this device?',
        confirmLabel: 'Remove Device',
        onConfirm: () => deleteDevice(deviceId),
        message: 'Are you sure you want to remove this device? You will need to pair with it again in order to import protocols, or upload data.',
      });
    }
  };

  const filteredDevices = filterTerm.length > 0
    ? devices.filter(({ name }) => name.toLowerCase().includes(filterTerm.toLowerCase()))
    : devices;

  return (
    <div className="device-list">
      <div className="device-list__header">
        <h4>Filter: </h4>
        <Text
          type="search"
          placeholder="Filter..."
          className="new-filterable-list__filter"
          input={{
            onChange: onFilterChange,
          }}
        />
      </div>
      { filteredDevices.length === 0
        && (
        <div className="device-list__empty">
          <h4>No paired devices.</h4>
        </div>
        )}
      { filteredDevices.length !== 0
        && (
        <>
          <div className="device-list__list">
            <Scroller>
              <motion.div
                variants={containerVariants}
                key="filterable-list"
                initial="hide"
                animate="show"
                className="filterable-list-scroller"
              >
                <AnimatePresence>
                  {
                    filteredDevices.map((device) => (
                      <motion.div
                        variants={itemVariants}
                        key={device.id}
                        exit="hide"
                        layout
                      >
                        <DeviceCard
                          // eslint-disable-next-line react/jsx-props-no-spreading
                          {...device}
                          key={device.id}
                          onDeleteHandler={() => confirmDelete(device.id)}
                        />
                      </motion.div>
                    ))
                  }
                </AnimatePresence>
              </motion.div>
            </Scroller>
          </div>
        </>
        )}
    </div>
  );
};

DeviceList.propTypes = {
  devices: PropTypes.array,
  deleteDevice: PropTypes.func.isRequired,
  openDialog: PropTypes.func.isRequired,
};

DeviceList.defaultProps = {
  devices: [],
};

const mapStateToProps = () => ({});

const mapDispatchToProps = {
  deleteDevice: actionCreators.deleteDevice,
  openDialog: dialogActions.openDialog,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(DeviceList);
