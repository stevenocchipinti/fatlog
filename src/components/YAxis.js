import React from "react";
import { axisRight } from "d3-axis";
import { select } from "d3-selection";

export default class Axis extends React.Component {
  componentDidMount() {
    this.renderAxis();
  }

  componentDidUpdate() {
    this.renderAxis();
  }

  renderAxis() {
    select(this.refs.axis).call(
      axisRight(this.props.scale)
        .ticks(5)
        .tickSize(this.props.width)
        .tickValues(null)
        .tickFormat("")
    );
  }

  render() {
    const translate = `translate(${this.props.position}, 0)`;
    return <g className="yaxis" ref="axis" transform={translate}></g>;
  }
}
