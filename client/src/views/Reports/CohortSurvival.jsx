import React from "react";
import {Col, Container, Row} from "reactstrap";
import EChart, {AXIS_STYLE, CHART_COLORS, CHART_TEXT_STYLE} from "../../components/Basic/EChart.jsx";

// Live larvae counts at 0/10/20/30/40/50/60 days post hatch.
// Start = total hatched, end = current live larvae (matches Egg Bowls mock data).
const DPH = [0, 10, 20, 30, 40, 50, 60];
const COHORTS = [
    {egg_bowl_id: 'EB-001', tank: 'C11', counts: [410, 405, 398, 392, 388, 386, 384]},
    {egg_bowl_id: 'EB-002', tank: 'C12', counts: [360, 350, 338, 330, 322, 318, 315]},
    {egg_bowl_id: 'EB-003', tank: 'C13', counts: [285, 281, 277, 273, 270, 268, 267]},
    {egg_bowl_id: 'EB-005', tank: 'E1',  counts: [525, 516, 508, 501, 495, 492, 490]},
    {egg_bowl_id: 'EB-006', tank: 'E2',  counts: [450, 444, 439, 434, 431, 429, 428]},
    {egg_bowl_id: 'EB-007', tank: 'C15', counts: [295, 283, 270, 259, 250, 244, 240]},
    {egg_bowl_id: 'EB-008', tank: 'E3',  counts: [167, 163, 159, 156, 154, 153, 152]},
];

function survivalOption(asPercent) {
    return {
        color: CHART_COLORS,
        textStyle: CHART_TEXT_STYLE,
        tooltip: {trigger: 'axis', valueFormatter: v => asPercent ? v + '%' : v},
        legend: {textStyle: CHART_TEXT_STYLE},
        grid: {left: 60, right: 20, top: 40, bottom: 45},
        xAxis: {type: 'category', name: 'Days Post Hatch', nameLocation: 'middle', nameGap: 30,
            data: DPH, ...AXIS_STYLE},
        yAxis: {type: 'value', name: asPercent ? '% Surviving' : 'Live Larvae',
            max: asPercent ? 100 : null, ...AXIS_STYLE},
        series: COHORTS.map(c => ({
            name: `${c.egg_bowl_id} (${c.tank})`,
            type: 'line',
            data: asPercent
                ? c.counts.map(n => Math.round(n / c.counts[0] * 1000) / 10)
                : c.counts,
        })),
    };
}

export default function CohortSurvival() {
    return (
        <div className="wrapper">
            <Container id="amphi-table-wrapper">
                <Row>
                    <Col>
                        <h6 style={{color: '#1d8cf8', marginBottom: '8px'}}>Larval Survival by Cohort</h6>
                        <EChart option={survivalOption(false)} height="340px"/>
                    </Col>
                </Row>
                <Row style={{marginTop: '24px'}}>
                    <Col>
                        <h6 style={{color: '#1d8cf8', marginBottom: '8px'}}>Percent Survival</h6>
                        <EChart option={survivalOption(true)} height="300px"/>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
