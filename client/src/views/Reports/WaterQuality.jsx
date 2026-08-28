import React, {useState} from "react";
import {Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row} from "reactstrap";
import EChart, {AXIS_STYLE, CHART_TEXT_STYLE} from "../../components/Basic/EChart.jsx";
import {DATES, TANKS} from "./waterQualityData.js";

const TANK_IDS = Object.keys(TANKS);

// Water quality is measured per system, so tank readings are near identical — average them for 'All'.
function avgSeries(field) {
    return DATES.map((_, idx) => {
        const vals = TANK_IDS.map(t => TANKS[t][field][idx]).filter(v => v !== null);
        if (vals.length === 0) return null;
        return Math.round(vals.reduce((a, v) => a + v, 0) / vals.length * 100) / 100;
    });
}

// Clean lines (no symbols), except isolated readings with gaps on both sides,
// which would be invisible without a marker.
function lineData(values) {
    return values.map((v, i) => {
        if (v === null) return null;
        const isolated = (i === 0 || values[i - 1] === null) &&
            (i === values.length - 1 || values[i + 1] === null);
        return isolated ? {value: v, symbol: 'circle', symbolSize: 6} : v;
    });
}

function notesAt(tank, idx) {
    if (tank === 'All') {
        return TANK_IDS.filter(t => TANKS[t].notes[idx])
            .map(t => `${t}: ${TANKS[t].notes[idx]}`).join('<br/>');
    }
    return TANKS[tank].notes[idx];
}

function waterQualityOption(tank) {
    const wq = tank === 'All'
        ? {temp: avgSeries('temp'), do_: avgSeries('do_'), salinity: avgSeries('salinity')}
        : TANKS[tank];
    const mortSeries = tank === 'All'
        ? TANK_IDS.map(t => ({name: `Morts ${t}`, type: 'bar', stack: 'morts', yAxisIndex: 1,
            barWidth: 8, itemStyle: {opacity: 0.8}, data: TANKS[t].morts}))
        : [{name: 'Mortalities', type: 'bar', yAxisIndex: 1, barWidth: 8,
            itemStyle: {opacity: 0.7}, data: TANKS[tank].morts}];
    return {
        color: ['#1d8cf8', '#00f2c3', '#ffd600', '#fd5d93', '#ff8d72', '#e14eca', '#8965e0'],
        textStyle: CHART_TEXT_STYLE,
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const idx = params[0].dataIndex;
                const lines = [DATES[idx]];
                params.forEach(p => {
                    if (p.value !== null && p.value !== undefined) {
                        lines.push(`${p.marker} ${p.seriesName}: ${p.value}`);
                    }
                });
                const notes = notesAt(tank, idx);
                if (notes) {
                    lines.push(`<div style="max-width:260px;white-space:normal;color:#aaa">${notes}</div>`);
                }
                return lines.join('<br/>');
            },
        },
        legend: {top: 0, textStyle: CHART_TEXT_STYLE},
        grid: {left: 50, right: 60, top: 50, bottom: 70},
        dataZoom: [
            {type: 'slider', bottom: 10, height: 20, borderColor: '#555',
                textStyle: {color: '#ccc'}},
            {type: 'inside'},
        ],
        xAxis: {type: 'category', data: DATES, ...AXIS_STYLE},
        yAxis: [
            {type: 'value', name: 'Reading', ...AXIS_STYLE},
            {type: 'value', name: 'Mortalities', minInterval: 1,
                splitLine: {show: false}, ...AXIS_STYLE},
        ],
        series: [
            {name: 'Temp (°C)', type: 'line', symbol: 'none', data: lineData(wq.temp)},
            {name: 'DO', type: 'line', symbol: 'none', data: lineData(wq.do_)},
            {name: 'Salinity', type: 'line', symbol: 'none', data: lineData(wq.salinity)},
            ...mortSeries,
        ],
    };
}

export default function WaterQuality() {
    const [tank, setTank] = useState('All');
    const [tankOpen, setTankOpen] = useState(false);

    return (
        <div className="wrapper">
            <Container id="amphi-table-wrapper">
                <Row className="amphi-table-wrapper-header">
                    <Col className="input-area">
                        <Row>
                            <Col><span>Tank:</span></Col>
                            <Col>
                                <Dropdown isOpen={tankOpen} toggle={() => setTankOpen(o => !o)}>
                                    <DropdownToggle style={{paddingTop: 0, paddingLeft: 0}}
                                                    caret color="default" nav>
                                        <span>{tank}</span>
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        {['All', ...TANK_IDS].map(t => (
                                            <DropdownItem key={t} onClick={() => setTank(t)}>
                                                {t}
                                            </DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                            </Col>
                        </Row>
                    </Col>
                    <Col/>
                </Row>
                <Row>
                    <Col>
                        <h6 style={{color: '#1d8cf8', marginBottom: '8px'}}>
                            Water Quality & Mortality — LFS Wet Lab SYS 3, {tank === 'All' ? 'All Tanks' : `Tank ${tank}`}
                        </h6>
                        <EChart option={waterQualityOption(tank)} height="460px"/>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
