import React from 'react';
import { XYPlot, VerticalRectSeries, HorizontalGridLines, XAxis as XAxisVis, YAxis as YAxisVis, Crosshair } from 'react-vis';

const myData = [
  { name: 'rew', x: 1, x0: 0, y: 10, y0: 0 },
  { name: 'fds', x: 2, x0: 1, y: 5, y0: 0 },
  { name: 'fff', x: 4, x0: 2, y: 15, y0: 0 },
];

const ReactVisSample = () => (
  <XYPlot
    height={400}
    width={400}
  >
    <VerticalRectSeries
      data={myData}
    />
    <XAxisVis
      animation
      style={{
        line: { stroke: '#ADDDE1' },
        ticks: { stroke: '#ADDDE1' },
        text: { stroke: 'none', fill: '#6b6b76', fontWeight: 600 } }}
    />
    <YAxisVis />
    <HorizontalGridLines />
    <Crosshair values={myData}>
      <div style={{ background: 'black' }}>
        <h3>Values of crosshair:</h3>
        <p>Series 1: {myData[0].name}</p>
      </div>
    </Crosshair>
  </XYPlot>
);

export default ReactVisSample;
