import React, {useState} from "react";
import {Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row} from "reactstrap";
import EChart, {AXIS_STYLE, CHART_COLORS, CHART_TEXT_STYLE} from "../../components/Basic/EChart.jsx";

const BOWLS = [
    {egg_bowl_id: 'EB-001', cross: 'PCF-001', facility: 'FCCL',   fert_rate: 0.91, hatch_rate: 0.91},
    {egg_bowl_id: 'EB-002', cross: 'PCF-002', facility: 'FCCL',   fert_rate: 0.84, hatch_rate: 0.80},
    {egg_bowl_id: 'EB-003', cross: 'PCF-003', facility: 'FCCL',   fert_rate: 0.97, hatch_rate: 0.95},
    {egg_bowl_id: 'EB-004', cross: 'PCF-004', facility: 'FCCL',   fert_rate: 0.0,  hatch_rate: 0.0},
    {egg_bowl_id: 'EB-005', cross: 'PCF-005', facility: 'PCF/AS', fert_rate: 0.90, hatch_rate: 0.88},
    {egg_bowl_id: 'EB-006', cross: 'PCF-006', facility: 'PCF/AS', fert_rate: 0.92, hatch_rate: 0.90},
    {egg_bowl_id: 'EB-007', cross: 'PCF-007', facility: 'PCF/AS', fert_rate: 0.80, hatch_rate: 0.74},
    {egg_bowl_id: 'EB-008', cross: 'PCF-008', facility: 'PCF/AS', fert_rate: 0.88, hatch_rate: 0.84},
];

const SEASONS = ['2025-2026'];

function pct(rate) {
    return Math.round(rate * 1000) / 10;
}

function byPairOption() {
    return {
        color: CHART_COLORS,
        textStyle: CHART_TEXT_STYLE,
        tooltip: {trigger: 'axis', valueFormatter: v => v + '%'},
        legend: {textStyle: CHART_TEXT_STYLE},
        grid: {left: 50, right: 20, top: 40, bottom: 30},
        xAxis: {type: 'category', data: BOWLS.map(b => b.cross), ...AXIS_STYLE},
        yAxis: {type: 'value', name: '%', max: 100, ...AXIS_STYLE},
        series: [
            {name: 'Fertilization Rate', type: 'bar', data: BOWLS.map(b => pct(b.fert_rate))},
            {name: 'Hatch Rate', type: 'bar', data: BOWLS.map(b => pct(b.hatch_rate))},
        ],
    };
}

function byFacilityOption() {
    const facilities = [...new Set(BOWLS.map(b => b.facility))];
    const mean = (vals) => vals.reduce((a, v) => a + v, 0) / vals.length;
    const facilityMean = (facility, field) =>
        pct(mean(BOWLS.filter(b => b.facility === facility).map(b => b[field])));
    return {
        color: CHART_COLORS,
        textStyle: CHART_TEXT_STYLE,
        tooltip: {trigger: 'axis', valueFormatter: v => v + '%'},
        legend: {textStyle: CHART_TEXT_STYLE},
        grid: {left: 50, right: 20, top: 40, bottom: 30},
        xAxis: {type: 'category', data: facilities, ...AXIS_STYLE},
        yAxis: {type: 'value', name: '%', max: 100, ...AXIS_STYLE},
        series: [
            {name: 'Mean Fertilization Rate', type: 'bar', barWidth: 60,
                data: facilities.map(f => facilityMean(f, 'fert_rate'))},
            {name: 'Mean Hatch Rate', type: 'bar', barWidth: 60,
                data: facilities.map(f => facilityMean(f, 'hatch_rate'))},
        ],
    };
}

export default function SpawningPerformance() {
    const [season, setSeason] = useState(SEASONS[0]);
    const [seasonOpen, setSeasonOpen] = useState(false);

    return (
        <div className="wrapper">
            <Container id="amphi-table-wrapper">
                <Row className="amphi-table-wrapper-header">
                    <Col className="input-area">
                        <Row>
                            <Col><span>Season:</span></Col>
                            <Col>
                                <Dropdown isOpen={seasonOpen} toggle={() => setSeasonOpen(o => !o)}>
                                    <DropdownToggle style={{paddingTop: 0, paddingLeft: 0}}
                                                    caret color="default" nav>
                                        <span>{season}</span>
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        {SEASONS.map(s => (
                                            <DropdownItem key={s} onClick={() => setSeason(s)}>
                                                {s}
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
                        <h6 style={{color: '#1d8cf8', marginBottom: '8px'}}>Fertilization & Hatch Rate by Pair</h6>
                        <EChart option={byPairOption()} height="340px"/>
                    </Col>
                </Row>
                <Row style={{marginTop: '24px'}}>
                    <Col>
                        <h6 style={{color: '#1d8cf8', marginBottom: '8px'}}>Mean Rates by Facility</h6>
                        <EChart option={byFacilityOption()} height="300px"/>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
