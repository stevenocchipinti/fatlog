import React, { Component } from "react";
import { max, min } from "d3";
import { scaleLinear, scaleTime } from "d3-scale";
import { zoom } from "d3-zoom";
import { select } from "d3-selection";
import Line from "./Line";
import XAxis from "./XAxis";
import YAxis from "./YAxis";
import Paper from "material-ui/Paper";
import { lightBlue500, orange500, green500 } from "material-ui/styles/colors";

class CheckinChart extends Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    const margin = 10;
    const width = this.props.width - margin * 2;
    const height = this.props.height;
    const verticalPadding = 20;
    const horizontalPadding = 10;

    const xScale = (data, accessor) => {
      return scaleTime()
        .domain([ min(data, accessor), max(data, accessor) ])
        .range([ horizontalPadding, width - horizontalPadding ]);
    };

    const yScale = (data, accessor) => {
      return scaleLinear()
        .domain([ min(data, accessor), max(data, accessor) ])
        .range([ height - verticalPadding * 2, verticalPadding ]);
    };

    const date = d => new Date(d.date);
    const dateScale = xScale(this.props.checkins, date);

    const zoomed = () => {
      var e = require("d3-selection").event;

      // TODO: use the x scale from state everywhere to allow changes
      this.setState({xScale: e.transform.rescaleX(this.state.dateScale)});

      console.log("zooooooom", e);
    };
    const zx = zoom().on("zoom", zoomed);

    const fat = d => d.fat;
    const fatScale = yScale(this.props.checkins, fat);

    const weight = d => d.weight;
    const weightScale = yScale(this.props.checkins, weight);

    const waist = d => d.waist;
    const waistScale = yScale(this.props.checkins, waist);

    const svgRef = (ref) => {
      zx(select(ref));
    };

    return (
      <Paper style={{ margin }} zDepth={1}>
        <svg ref={svgRef} width={width} height={height}>
          <XAxis position={height - verticalPadding} scale={dateScale} />
          <YAxis position={horizontalPadding} width={width - horizontalPadding * 2} scale={dateScale} />
          <Line
            x={d => dateScale(date(d))}
            y={d => fatScale(fat(d))}
            data={this.props.checkins}
            color={lightBlue500}
          />
          <Line
            x={d => dateScale(date(d))}
            y={d => weightScale(weight(d))}
            data={this.props.checkins}
            color={green500}
          />
          <Line
            x={d => dateScale(date(d))}
            y={d => waistScale(waist(d))}
            data={this.props.checkins}
            color={orange500}
          />
        </svg>
      </Paper>
    );
  }
}

export default CheckinChart;
