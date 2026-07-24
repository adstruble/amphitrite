import React from "react";
import {Col, Container, Row} from "reactstrap";
import EChart, {AXIS_STYLE, CHART_TEXT_STYLE} from "../../components/Basic/EChart.jsx";
import {COHORTS, FEED_STAGES, SNAPSHOT_DATE} from "./cohortData.js";

const STAGE_COLORS = {
    'Rotifer Only': '#00f2c3',
    'Rotifer + A1': '#1d8cf8',
    'A1 Only': '#ffd600',
    'A1 + A2': '#ff8d72',
    'A2 Only': '#fd5d93',
    'Weaned': '#8965e0',
    '—': '#555',
};

function StatCard({label, value, sub}) {
    return (
        <Col>
            <div style={{border: '1px solid #2b3553', borderRadius: '6px', padding: '14px 18px'}}>
                <div style={{color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase'}}>{label}</div>
                <div style={{color: '#fff', fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.2}}>{value}</div>
                {sub && <div style={{color: '#888', fontSize: '0.8rem'}}>{sub}</div>}
            </div>
        </Col>
    );
}

function timelineOption() {
    const maxDph = Math.max(FEED_STAGES[FEED_STAGES.length - 1].end,
        ...COHORTS.map(c => c.dph)) + 5;
    const labels = COHORTS.map(c => `${c.eggBowl} · ${c.tank}`);

    // feed-stage bands drawn behind the bars
    const stageBands = FEED_STAGES.map(s => [
        {xAxis: s.start, itemStyle: {color: STAGE_COLORS[s.name], opacity: 0.10}},
        {xAxis: s.end + 1},
    ]);

    return {
        textStyle: CHART_TEXT_STYLE,
        tooltip: {
            trigger: 'item',
            formatter: (p) => {
                const c = COHORTS[p.dataIndex];
                return `<b>${c.eggBowl}</b> (Cross ${c.cross})<br/>`
                    + `Tank: ${c.tank}<br/>Spawned: ${c.spawnDate}<br/>`
                    + `Age: ${c.dph} DPH<br/>Feed: ${c.stage}`;
            },
        },
        grid: {left: 110, right: 30, top: 50, bottom: 45},
        xAxis: {
            type: 'value', name: 'Days Post Hatch', nameLocation: 'middle', nameGap: 30,
            min: 0, max: maxDph, ...AXIS_STYLE,
        },
        yAxis: {
            type: 'category', inverse: true, data: labels,
            axisLabel: {color: '#ccc', fontSize: 11}, ...AXIS_STYLE,
        },
        series: [{
            type: 'bar',
            barWidth: 11,
            data: COHORTS.map(c => ({value: c.dph, itemStyle: {color: STAGE_COLORS[c.stage]}})),
            markArea: {silent: true, data: stageBands},
            label: {
                show: true, position: 'right', color: '#ccc', fontSize: 10,
                formatter: (p) => `${COHORTS[p.dataIndex].dph}d`,
            },
        }],
    };
}

function stageLegend() {
    return (
        <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', margin: '4px 0 12px 110px'}}>
            {FEED_STAGES.map(s => (
                <span key={s.name} style={{color: '#ccc', fontSize: '0.8rem'}}>
                    <span style={{display: 'inline-block', width: '11px', height: '11px',
                        background: STAGE_COLORS[s.name], borderRadius: '2px', marginRight: '5px',
                        verticalAlign: 'middle'}}/>
                    {s.name} <span style={{color: '#777'}}>({s.start}–{s.end}d)</span>
                </span>
            ))}
        </div>
    );
}

export default function CohortTracker() {
    const ages = COHORTS.map(c => c.dph);
    const stageCounts = COHORTS.reduce((acc, c) => {
        acc[c.stage] = (acc[c.stage] || 0) + 1;
        return acc;
    }, {});
    const topStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0];

    return (
        <div className="wrapper" style={{height: 'calc(100vh - 90px)', overflowY: 'auto', overflowX: 'hidden'}}>
            <Container id="amphi-table-wrapper" style={{paddingBottom: '40px'}}>
                <Row className="amphi-table-wrapper-header" style={{marginBottom: '8px'}}>
                    <span style={{color: '#888', fontSize: '0.85rem'}}>
                        Snapshot as of {SNAPSHOT_DATE} · LFS Larvae Current Ages
                    </span>
                </Row>
                <Row style={{marginBottom: '20px'}}>
                    <StatCard label="Active Cohorts" value={COHORTS.length}/>
                    <StatCard label="Age Range" value={`${Math.min(...ages)}–${Math.max(...ages)}`} sub="days post hatch"/>
                    <StatCard label="Tanks In Use" value={new Set(COHORTS.map(c => c.tank)).size}/>
                    <StatCard label="Most Common Feed" value={topStage[0]} sub={`${topStage[1]} cohorts`}/>
                </Row>
                <Row>
                    <Col>
                        <h6 style={{color: '#1d8cf8', marginBottom: '8px'}}>Feed-Stage Timeline</h6>
                        {stageLegend()}
                        <EChart option={timelineOption()} height={`${COHORTS.length * 26 + 100}px`}/>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
