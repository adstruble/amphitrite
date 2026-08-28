import React, {useState} from "react";
import {Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row} from "reactstrap";
import EChart, {AXIS_STYLE, CHART_TEXT_STYLE} from "../../components/Basic/EChart.jsx";
import {CURRENT_FISH, FUNNEL, FUTURE_STAGES, LOSSES, SEASON, SUMMARY} from "./spawningPerformanceData.js";
import {LARVAE_COHORTS} from "../LarvalCohorts/larvalCohortData.js";

const SEASONS = [SEASON];

const STAGE_COLORS = ['#1d8cf8', '#00f2c3', '#ffd600', '#46c37b'];

function StatCard({label, value, sub, accent}) {
    return (
        <Col>
            <div style={{border: '1px solid #2b3553', borderRadius: '6px', padding: '14px 18px'}}>
                <div style={{color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase'}}>{label}</div>
                <div style={{color: accent || '#fff', fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.2}}>{value}</div>
                {sub && <div style={{color: '#888', fontSize: '0.8rem'}}>{sub}</div>}
            </div>
        </Col>
    );
}

function funnelOption() {
    return {
        textStyle: CHART_TEXT_STYLE,
        tooltip: {
            trigger: 'item',
            formatter: (p) => {
                const f = FUNNEL[p.dataIndex];
                return `<b>${f.stage}</b><br/>${f.count.toLocaleString()} (${f.pct}% of eggs)<br/>`
                    + `<span style="color:#aaa">${f.note}</span>`;
            },
        },
        series: [{
            type: 'funnel',
            min: 0, max: 100,
            minSize: '30%', maxSize: '100%',
            sort: 'descending',
            gap: 3,
            left: '5%', right: '5%', top: 10, bottom: 10,
            label: {
                color: '#fff', position: 'inside',
                formatter: (p) => `${FUNNEL[p.dataIndex].stage}: ${FUNNEL[p.dataIndex].count.toLocaleString()} (${FUNNEL[p.dataIndex].pct}%)`,
            },
            itemStyle: {borderColor: '#1e1e2f', borderWidth: 1},
            data: FUNNEL.map((f, i) => ({value: f.pct, name: f.stage,
                itemStyle: {color: STAGE_COLORS[i % STAGE_COLORS.length]}})),
        }],
    };
}

function FutureStage({stage, note, last}) {
    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            <div style={{
                flex: 1, border: '1px dashed #44506b', borderRadius: '6px', padding: '12px 14px',
                background: 'rgba(68,80,107,0.08)',
            }}>
                <div style={{color: '#8a93a8', fontSize: '0.9rem', fontWeight: 600}}>{stage}</div>
                <div style={{color: '#6b7488', fontSize: '0.75rem', marginTop: '2px'}}>{note}</div>
                <div style={{fontSize: '0.7rem', marginTop: '6px', fontStyle: 'italic', color: '#5a627a'}}>
                    Tracked as data accumulates
                </div>
            </div>
            {!last && <span style={{color: '#44506b', margin: '0 6px', fontSize: '1.1rem'}}>→</span>}
        </div>
    );
}

export default function SpawningPerformance() {
    const [season, setSeason] = useState(SEASONS[0]);
    const [seasonOpen, setSeasonOpen] = useState(false);

    return (
        <div className="wrapper" style={{height: 'calc(100vh - 90px)', overflowY: 'auto', overflowX: 'hidden'}}>
            <Container id="amphi-table-wrapper" style={{paddingBottom: '40px'}}>
                <Row className="amphi-table-wrapper-header" style={{marginBottom: '16px'}}>
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
                                            <DropdownItem key={s} onClick={() => setSeason(s)}>{s}</DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                            </Col>
                        </Row>
                    </Col>
                    <Col/>
                </Row>

                <Row style={{marginBottom: '20px'}}>
                    <StatCard label="Eggs Collected" value={SUMMARY.eggs.toLocaleString()} sub={`${SUMMARY.bowls} egg bowls`}/>
                    <StatCard label="Larvae Produced" value={SUMMARY.hatched.toLocaleString()} sub="hatched"/>
                    <StatCard label="Live Larvae" value={SUMMARY.liveLarvae.toLocaleString()} sub="currently rearing" accent="#46c37b"/>
                    <StatCard label="Egg → Larvae Survival" value={`${SUMMARY.overallPct}%`} sub="of all eggs collected" accent="#1d8cf8"/>
                </Row>

                <Row>
                    <Col>
                        <h6 style={{color: '#1d8cf8', marginBottom: '4px'}}>Survival Pipeline — Measured</h6>
                        <div style={{color: '#888', fontSize: '0.8rem', marginBottom: '8px'}}>
                            Where fish are lost from egg to larva this season.
                        </div>
                        <EChart option={funnelOption()} height="320px"/>
                    </Col>
                </Row>

                <Row style={{marginTop: '8px', marginBottom: '20px'}}>
                    <Col>
                        <div style={{border: '1px solid #2b3553', borderLeft: '3px solid #fd5d93',
                            borderRadius: '6px', padding: '12px 16px'}}>
                            <span style={{color: '#fd5d93', fontWeight: 600}}>Biggest loss point: </span>
                            <span style={{color: '#ddd'}}>
                                {SUMMARY.biggestDropLabel} — {SUMMARY.biggestDropCount.toLocaleString()} fish
                                ({SUMMARY.biggestDropPct}% of all eggs) lost at this stage.
                                Reducing early-pipeline loss is the refuge's nearest-term lever.
                            </span>
                        </div>
                    </Col>
                </Row>

                <Row style={{marginBottom: '20px'}}>
                    <Col>
                        <h6 style={{color: '#ffd600', marginBottom: '4px'}}>Survival Pipeline — Current Fish</h6>
                        <div style={{color: '#888', fontSize: '0.8rem', marginBottom: '10px'}}>
                            The larvae don't stop at the egg-count sheet — they continue into the tanks,
                            monitored daily through Fish Care.
                        </div>
                        <div style={{border: '1px solid #ffd600', borderRadius: '6px', padding: '14px 18px',
                            background: 'rgba(255,214,0,0.05)'}}>
                            <Row>
                                <Col xs="auto">
                                    <div style={{color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase'}}>Cohorts rearing</div>
                                    <div style={{color: '#ffd600', fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.2}}>{LARVAE_COHORTS.length}</div>
                                    <div style={{color: '#888', fontSize: '0.75rem'}}>from Larval Cohorts</div>
                                </Col>
                                <Col style={{display: 'flex', alignItems: 'center', borderLeft: '1px solid #2b3553'}}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        flex: '0 0 auto', width: '26px', height: '26px', borderRadius: '50%',
                                        background: '#ffd600', color: '#1e1e2f', fontWeight: 800,
                                        fontSize: '1rem', marginRight: '10px',
                                    }}>!</span>
                                    <div>
                                        <div style={{color: '#ddd', fontSize: '0.85rem', fontWeight: 600}}>
                                            {CURRENT_FISH.missingTitle}
                                        </div>
                                        <div style={{color: '#999', fontSize: '0.8rem', marginTop: '4px'}}>
                                            {CURRENT_FISH.missing}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            <div style={{color: '#777', fontSize: '0.72rem', marginTop: '8px'}}>
                                {CURRENT_FISH.monitoring}
                            </div>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <h6 style={{color: '#8a93a8', marginBottom: '4px'}}>Survival Pipeline — Long Term</h6>
                        <div style={{color: '#888', fontSize: '0.8rem', marginBottom: '10px'}}>
                            The species-survival question — how many fish reach breeding age and reproduce —
                            spans years per generation. Amphitrite links each season so these become measurable over time.
                        </div>
                        <div style={{display: 'flex', alignItems: 'stretch'}}>
                            {FUTURE_STAGES.map((s, i) => (
                                <FutureStage key={s.stage} stage={s.stage} note={s.note}
                                             last={i === FUTURE_STAGES.length - 1}/>
                            ))}
                        </div>
                    </Col>
                </Row>

                <Row style={{marginTop: '20px'}}>
                    <Col>
                        <h6 style={{color: '#1d8cf8', marginBottom: '8px'}}>Notable Losses This Season</h6>
                        <table style={{fontSize: '0.85rem', width: '100%'}}>
                            <tbody>
                                {LOSSES.map(l => (
                                    <tr key={l.egg_id}>
                                        <td style={{color: '#aaa', paddingRight: '12px', whiteSpace: 'nowrap', verticalAlign: 'top'}}>
                                            Cross {l.cross} ({l.egg_id})
                                        </td>
                                        <td style={{color: '#ddd'}}>{l.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
