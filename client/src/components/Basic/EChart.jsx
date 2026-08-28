import React, {useEffect, useRef} from "react";
import * as echarts from "echarts";

export const CHART_COLORS = ['#1d8cf8', '#00f2c3', '#fd5d93', '#ff8d72', '#e14eca', '#ffd600', '#46c37b', '#8965e0'];

export const CHART_TEXT_STYLE = {color: '#ccc'};

export const AXIS_STYLE = {
    axisLine: {lineStyle: {color: '#555'}},
    axisLabel: {color: '#ccc'},
    splitLine: {lineStyle: {color: '#333'}},
    nameTextStyle: {color: '#ccc'},
};

export default function EChart({option, height = '400px'}) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        chartRef.current = echarts.init(containerRef.current);
        const onResize = () => chartRef.current && chartRef.current.resize();
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            chartRef.current.dispose();
            chartRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.setOption(option, true);
        }
    }, [option]);

    return <div ref={containerRef} style={{width: '100%', height}}/>;
}
