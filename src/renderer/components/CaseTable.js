import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Column, InfiniteLoader, Table } from 'react-virtualized';
import Draggable from 'react-draggable';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import { formatDate } from '../utils/formatters';

class CaseTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      widths: {
        createdAt: 0.15,
        updatedAt: 0.15,
        caseId: 0.25,
        sessionId: 0.25,
      },
    };
  }

  checkboxRenderer = ({ rowIndex }) => {
    const selectedSessionId = this.props.list[rowIndex] && this.props.list[rowIndex].id;
    return (
      <Checkbox
        className="case-management__checkbox"
        label=" "
        input={{
          name: 'case-management__list-item',
          checked: this.props.isSessionSelected(selectedSessionId),
          value: selectedSessionId,
          onChange: () => this.props.updateSessionsToDelete(selectedSessionId),
        }}
      />
    );
  };

  checkboxHeaderRenderer = () => (
    <Checkbox
      className="case-management__checkbox"
      label=" "
      input={{
        name: 'case-management__list-item',
        checked: this.props.allSessionsSelected(),
        value: this.props.allSessionsSelected(),
        onChange: this.props.toggleAllSessions,
      }}
    />
  );

  directionSymbol = (dataKey) => {
    if (dataKey === this.props.sortType) {
      return this.props.sortDirection === 1 ? ' \u25BC' : ' \u25B2';
    }
    return '';
  };

  headerRenderer = ({ dataKey, label }, adjustable = true) => (
    <React.Fragment key={dataKey}>
      <div className="ReactVirtualized__Table__headerTruncatedText" onClick={() => this.props.sortSessions(dataKey)} role="button" tabIndex={0}>
        {`${label} ${this.directionSymbol(dataKey)}`}
      </div>
      {adjustable && <Draggable
        axis="x"
        defaultClassName="ReactVirtualized__DragHandle"
        defaultClassNameDragging="ReactVirtualized__DragHandleActive"
        onDrag={(_, { deltaX }) =>
          this.resizeRow({
            dataKey,
            deltaX,
          })
        }
        position={{ x: 0 }}
        zIndex={999}
      >
        <span className="ReactVirtualized__DragHandleIcon">⋮</span>
      </Draggable>}
    </React.Fragment>
  );

  resizeRow = ({ dataKey, deltaX }) =>
    this.setState((prevState) => {
      const prevWidths = prevState.widths;
      const percentDelta = deltaX / this.props.width;

      let nextDataKey;
      switch (dataKey) {
        case 'checkbox':
          nextDataKey = 'createdAt';
          break;
        case 'createdAt':
          nextDataKey = 'updatedAt';
          break;
        case 'updatedAt':
          nextDataKey = 'caseId';
          break;
        case 'caseId':
          nextDataKey = 'sessionId';
          break;
        default:
          nextDataKey = 'sessionId';
      }

      return {
        widths: {
          ...prevWidths,
          [dataKey]: prevWidths[dataKey] + percentDelta,
          [nextDataKey]: prevWidths[nextDataKey] - percentDelta,
        },
      };
    });

  loadMore = ({ startIndex, stopIndex }) => {
    const { loadMoreSessions } = this.props;

    return loadMoreSessions(startIndex, stopIndex + 1);
  }

  render() {
    const { list, width, height } = this.props;
    const { widths } = this.state;

    return (
      <InfiniteLoader
        isRowLoaded={({ index }) => !!list[index]}
        loadMoreRows={this.loadMore}
        minimumBatchSize={100}
        rowCount={this.props.totalSessionsCount}
        threshold={30}
      >
        {({ onRowsRendered, registerChild }) => (
          <Table
            ref={registerChild}
            onRowsRendered={onRowsRendered}
            width={width}
            height={height}
            headerHeight={40}
            rowHeight={30}
            rowCount={this.props.totalSessionsCount}
            rowGetter={({ index }) => ({
              checkbox: list[index] ? list[index].id : '...',
              createdAt: list[index] ? formatDate(list[index] && list[index].createdAt) : '...',
              updatedAt: list[index] ? formatDate(list[index] && list[index].updatedAt) : '...',
              caseId: list[index] && list[index].data &&
                list[index].data.sessionVariables ?
                // eslint-disable-next-line no-underscore-dangle
                list[index].data.sessionVariables.caseId : '...',
              sessionId: list[index] ? list[index].id : '...',
            })}
            rowClassName={({ index }) => {
              if (index !== -1 && index % 2 === 0) {
                return 'ReactVirtualized__even';
              }
              return 'ReactVirtualized__odd';
            }}
          >
            <Column
              headerRenderer={this.checkboxHeaderRenderer}
              dataKey="checkbox"
              label="Selected"
              width={60}
              cellRenderer={({ rowIndex }) => this.checkboxRenderer({ rowIndex })}
            />
            <Column
              headerRenderer={this.headerRenderer}
              dataKey="createdAt"
              label="Created At"
              width={widths.createdAt * width}
            />
            <Column
              headerRenderer={this.headerRenderer}
              dataKey="updatedAt"
              label="Updated At"
              width={widths.updatedAt * width}
            />
            <Column
              headerRenderer={this.headerRenderer}
              dataKey="caseId"
              label="Case ID"
              width={widths.caseId * width}
            />
            <Column
              headerRenderer={options => this.headerRenderer(options, false)}
              dataKey="sessionId"
              label="Session ID"
              width={widths.sessionId * width}
            />
          </Table>
        )}
      </InfiniteLoader>
    );
  }
}

CaseTable.defaultProps = {
  list: [],
  totalSessionsCount: 0,
  width: 500,
  height: 500,
};

CaseTable.propTypes = {
  list: PropTypes.array,
  totalSessionsCount: PropTypes.number,
  loadMoreSessions: PropTypes.func.isRequired,
  sortType: PropTypes.string.isRequired,
  sortDirection: PropTypes.number.isRequired,
  sortSessions: PropTypes.func.isRequired,
  isSessionSelected: PropTypes.func.isRequired,
  allSessionsSelected: PropTypes.func.isRequired,
  updateSessionsToDelete: PropTypes.func.isRequired,
  toggleAllSessions: PropTypes.func.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};

export default CaseTable;
