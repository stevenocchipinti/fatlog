import React, { Component } from "react";
import "amcharts3";
import "amcharts3/amcharts/serial";
import "amcharts3/amcharts/themes/light";

class CheckinChart extends Component {
  componentDidMount() {
    var chartData = this.props.checkins.map(checkin => {
      return {
        weight: checkin.weight,
        fat: checkin.fat,
        waist: checkin.waist,
        date: new Date(checkin.date)
      };
    }).reverse();

    var chart = window.AmCharts.makeChart("chartdiv", {
      "type": "serial",
      "theme": "none",
      "legend": {
        "useGraphSettings": true,
        "autoMargins": false,
        "valueWidth": 30
      },
      "dataProvider": chartData,
      "synchronizeGrid": true,
      "valueAxes": [
        {
          "id": "v1",
          "axisColor": "#FF6600",
          "axisThickness": 2,
          "axisAlpha": 1,
          "position": "left"
        },
        {
          "id": "v2",
          "axisColor": "#FCD202",
          "axisThickness": 2,
          "axisAlpha": 1,
          "position": "right"
        },
        {
          "id": "v3",
          "axisColor": "#B0DE09",
          "axisThickness": 2,
          "gridAlpha": 0,
          "offset": 50,
          "axisAlpha": 1,
          "position": "left"
        }
      ],
      "graphs": [
        {
          "valueAxis": "v1",
          "lineColor": "#FF6600",
          "bullet": "round",
          "bulletBorderThickness": 1,
          "hideBulletsCount": 30,
          "title": "Weight",
          "valueField": "weight",
          "fillAlphas": 0
        },
        {
          "valueAxis": "v2",
          "lineColor": "#FCD202",
          "bullet": "square",
          "bulletBorderThickness": 1,
          "hideBulletsCount": 30,
          "title": "Fat",
          "valueField": "fat",
          "fillAlphas": 0
        },
        {
          "valueAxis": "v3",
          "lineColor": "#B0DE09",
          "bullet": "triangleUp",
          "bulletBorderThickness": 1,
          "hideBulletsCount": 30,
          "title": "Waist",
          "valueField": "waist",
          "fillAlphas": 0
        }
      ],
      "chartScrollbar": {},
      "chartCursor": { "cursorPosition": "mouse" },
      "categoryField": "date",
      "categoryAxis": {
        "parseDates": true,
        "axisColor": "#DADADA",
        "minorGridEnabled": true
      },
      "export": { "enabled": true, "position": "bottom-right" },
      "path": "amcharts"
    });

    chart.addListener("dataUpdated", zoomChart);
    zoomChart();

    function zoomChart() {
      chart.zoomToIndexes(
        chart.dataProvider.length - 20,
        chart.dataProvider.length - 1
      );
    }
  }

  render() {
    return <div style={{ height: "400px" }} id="chartdiv" />;
  }
}

export default CheckinChart;
