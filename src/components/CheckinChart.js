import React, { Component } from "react";
import { VictoryChart, VictoryLine, VictoryZoom, VictoryTheme, VictoryScatter } from "victory";

export default class CheckinChart extends Component {
  constructor(props) {
    super(props);
    this.state = { zoomDomain: this.sixMonthPeriod() };
  }

  sixMonthPeriod(endDate = new Date()) {
    let startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30 * 6);
    return [ startDate, endDate ];
  }

  render() {
    return (
      <VictoryZoom
        zoomDomain={{x: this.state.zoomDomain}}
        onDomainChange={ domain => console.log(domain) }
      >
        <VictoryChart
          scale={{x: "time", y: "linear"}}
          theme={ VictoryTheme.material }
        >
          <VictoryScatter
            data={ this.props.checkins }
            x={ x => new Date(x.date) }
            y="fat"
          />
          <VictoryLine
            data={ this.props.checkins }
            x={ x => new Date(x.date) }
            y="fat"
          />
        </VictoryChart>
      </VictoryZoom>
    );
  }
}
