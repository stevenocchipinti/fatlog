import React from "react";
import { axisBottom } from "d3-axis";
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
      axisBottom(this.props.scale).ticks(4)
    );
  }

  render() {
    const translate = `translate(0, ${this.props.position})`;
    return <g className="axis" ref="axis" transform={translate}></g>;
  }
}
