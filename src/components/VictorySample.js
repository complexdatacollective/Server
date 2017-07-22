import React from 'react';
import { VictoryChart, VictoryGroup, VictoryArea, VictoryAxis, VictoryVoronoiContainer, VictoryTooltip } from 'victory';

const VictorySample = () => (
  <VictoryChart
    width={400}
    height={400}
    containerComponent={
      <VictoryVoronoiContainer
        dimension="x"
        labels={d => d.x}
        labelComponent={<VictoryTooltip cornerRadius={0} flyoutStyle={{ fill: 'white' }} />}
      />
    }
  >
    <VictoryGroup
      style={{
        data: { strokeWidth: 3, fillOpacity: 0.4 },
      }}
    >
      <VictoryArea
        data={[
          { x: 1, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 5 },
          { x: 5, y: 7 },
          { x: 6, y: 0 },
        ]}
        interpolation="stepAfter"
        style={{
          data: { fill: 'cyan', stroke: 'cyan' },
        }}
      />
    </VictoryGroup>
    <VictoryAxis
      crossAxis
      label="something"
      style={{
        grid: { stroke: 'white' },
      }}
    />
    <VictoryAxis
      dependentAxis
      crossAxis
      label="something else"
    />

  </VictoryChart>
);

export default VictorySample;
