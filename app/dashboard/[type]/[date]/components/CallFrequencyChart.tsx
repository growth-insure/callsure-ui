import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CallFrequencyData {
  hour: string;
  calls: number;
}

interface CallFrequencyChartProps {
  data: CallFrequencyData[];
}

const CallFrequencyChart: React.FC<CallFrequencyChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const option = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "8%",
          top: "8%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: data.map((item) => item.hour),
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            interval: 0,
            fontSize: 11,
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: "#f0f0f0",
            },
          },
        },
        yAxis: {
          type: "value",
          max: 10,
          interval: 2,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: "#f0f0f0",
            },
          },
        },
        series: [
          {
            type: "bar",
            data: data.map((item) => item.calls),
            itemStyle: {
              color: "#36A2EB",
              borderRadius: [2, 2, 0, 0],
            },
            barWidth: "60%", // Increased bar width
            emphasis: {
              itemStyle: {
                color: "#2196F3",
              },
            },
          },
        ],
      };

      chartInstance.current.setOption(option);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [data]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Frequency Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[400px]" />
      </CardContent>
    </Card>
  );
};

export default CallFrequencyChart;
