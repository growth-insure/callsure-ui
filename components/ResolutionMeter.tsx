"use client";

import { useEffect, useRef } from "react";
import { init } from "echarts";
import type { EChartsOption } from "echarts";

function ResolutionMeter({ value }: { value: number }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: echarts.ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current);
    }

    const option: EChartsOption = {
      series: [
        {
          type: "gauge",
          progress: {
            show: true,
            width: 25, // reduced from 18
            itemStyle: {
              color: "#2196F3", // blue color matching screenshot
            },
          },
          axisLine: {
            lineStyle: {
              width: 25, // reduced from 18
              color: [
                [1, "#E0E0E0"], // light gray background
              ],
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            length: 10, // reduced length
            lineStyle: {
              width: 1,
              color: "#999",
            },
          },
          axisLabel: {
            distance: 25,
            color: "#999",
            fontSize: 12, // reduced font size
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 20, // reduced size
            itemStyle: {
              borderWidth: 8,
              color: "#2196F3", // matching blue color
            },
          },
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            fontSize: 36, // adjusted size
            offsetCenter: [0, "70%"],
            formatter: "{value}%", // add percentage symbol
            color: "#000000", // black color for value
          },
          data: [
            {
              value: value, // use the prop value instead of hardcoded 70
            },
          ],
        },
      ],
    };
    chart?.setOption(option);

    return () => {
      chart?.dispose();
    };
  }, [value]);

  return <div ref={chartRef} className="w-full h-[300px]" />;
}

export default ResolutionMeter;
