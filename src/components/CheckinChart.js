import React, { Component } from "react";
import { line } from "d3";
import { scaleLinear, scaleTime } from "d3-scale";
import { axisBottom } from "d3-axis";
import { zoom } from "d3-zoom";
import { select } from "d3-selection";
import Paper from "material-ui/Paper";

const MARGINS = { top: 20, right: 20, bottom: 20, left: 20 };
const HEIGHT = 250 - MARGINS.left - MARGINS.right;
const WIDTH = 250 - MARGINS.top - MARGINS.bottom;

class CheckinChart extends Component {
  constructor(props) {
    super(props);
    this.state = this.propsToState(props);
  }

  componentWillReceiveProps(props) {
    this.setState(this.propsToState(props));
  }

  propsToState(props) {
    let dateScale = scaleTime()
      .range([ 0, props.width - 20 - MARGINS.left - MARGINS.right ])
      .domain([ new Date("2017-01-01"), new Date("2017-01-22") ]);

    return {
      innerWidth: props.width - 20,
      dateScale: dateScale,
      originalDateScale: dateScale.copy(),
      yScale: scaleLinear().range([ props.height, 0 ]).domain([ 20, 26 ]),
      data: [
        { date: new Date("2017-01-01"), value: 25 },
        { date: new Date("2017-01-08"), value: 23 },
        { date: new Date("2017-01-15"), value: 24 },
        { date: new Date("2017-01-22"), value: 21 }
      ]
    };
  }

  componentDidMount() {
    const zoomBehaviour = zoom()
      .scaleExtent([ 1, Infinity ])
      .translateExtent([ [ 0, 0 ], [ this.state.innerWidth, HEIGHT ] ])
      .extent([ [ 0, 0 ], [ this.state.innerWidth, HEIGHT ] ])
      .on("zoom", () => {
        const e = require("d3-selection").event;
        this.setState({
          ...this.state,
          dateScale: e.transform.rescaleX(this.state.originalDateScale)
        });
      });
    select(this.refs.focus).call(zoomBehaviour);
  }

  render() {
    const xAxisRef = ref => {
      select(ref).call(axisBottom(this.state.dateScale));
    };

    const lineGenerator = line()
      .x(d => this.state.dateScale(d.date))
      .y(d => this.state.yScale(d.value));
    const linePath = lineGenerator(this.state.data);

    return (
      <Paper style={{ margin: 10 }} zDepth={1}>
        <svg width={this.state.innerWidth} height={this.props.height}>
          <defs>
            <clipPath id="clip">
              <rect width={this.state.innerWidth - 40} height={
                this.props.height
              } />
            </clipPath>
          </defs>
          <g ref="focus" className="focus" transform={
            `translate(${MARGINS.left}, ${MARGINS.top})`
          }>
            <g ref={xAxisRef} className="xAxis" transform={
              `translate(0, ${HEIGHT})`
            } />
            <path className="line" style={
              { fill: "none", stroke: "steelblue", clipPath: "url(#clip)" }
            } d={linePath} />
            <rect className="zoom" height={HEIGHT} width={WIDTH} style={
              { cursor: "move", fill: "none", pointerEvents: "all" }
            }></rect>
          </g>
        </svg>
      </Paper>
    );
  }
}

export default CheckinChart;

