import React, {useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {Button, Col, Container, FormGroup, Input, InputGroup, InputGroupText,
    Label, Pagination, PaginationItem, Row} from "reactstrap";
import HeaderLabel from "../../components/Table/HeaderLabel.jsx";
import {
    Body,
    Cell,
    Header,
    HeaderCell,
    HeaderRow,
    Row as TableRow,
    Table,
} from '@table-library/react-table-library/table';
import {useTheme} from "@table-library/react-table-library/theme";
import {getTheme} from "@table-library/react-table-library/baseline";
import classnames from "classnames";
import FishDataUpload from "../../components/Upload/FishDataUpload";
import AmphiAlert from "../../components/Basic/AmphiAlert";
import {EGG_BOWLS} from "./eggBowlData.js";
import {LARVAE_COHORTS} from "../LarvalCohorts/larvalCohortData.js";

const ALL_COLS = [
    {id: 'spawn_date',       label: 'Spawn Date',      key: 'spawn_date',       width: '1fr',   defaultVisible: true},
    {id: 'current_age_dph',  label: 'Current Age (DPH)', key: 'current_age_dph', width: '.9fr', defaultVisible: true, numeric: true},
    {id: 'egg_id',           label: 'Egg Bowl ID',     key: 'egg_id',           width: '1fr',   defaultVisible: true},
    {id: 'cross',            label: 'Cross',           key: 'cross',            width: '.8fr',  defaultVisible: true},
    {id: 'total_egg',        label: 'Total Eggs',      key: 'total_egg',        width: '.7fr',  defaultVisible: true,  numeric: true},
    {id: 'fert_rate',        label: 'Fert Rate',       key: 'fert_rate',        width: '.7fr',  defaultVisible: true,  numeric: true},
    {id: 'incubator_date',   label: 'Incubator Date',  key: 'incubator_date',   width: '1fr',   defaultVisible: false},
    {id: 'incubator_id',     label: 'Incubator ID',    key: 'incubator_id',     width: '.8fr',  defaultVisible: false},
    {id: 'total_hatched',    label: 'Total Hatched',   key: 'total_hatched',    width: '.8fr',  defaultVisible: true,  numeric: true},
    {id: 'hatch_rate',       label: 'Hatch Rate',      key: 'hatch_rate',       width: '.7fr',  defaultVisible: true,  numeric: true},
    {id: 'larval_tank_id',   label: 'Larval Tank',     key: 'larval_tank_id',   width: '.8fr',  defaultVisible: true},
    {id: 'notes',            label: 'Notes',           key: 'notes',            width: '2fr',   defaultVisible: true},
    {id: 'n_live_egg_6dpf',  label: 'Live Eggs 6dpf',  key: 'n_live_egg_6dpf',  width: '.9fr',  defaultVisible: false, numeric: true},
    {id: 'n_mort_egg_6dpf',  label: 'Mort Eggs 6dpf',  key: 'n_mort_egg_6dpf',  width: '.9fr',  defaultVisible: false, numeric: true},
    {id: 'egg_morts_16dpf',  label: 'Egg Morts 16dpf', key: 'egg_morts_16dpf',  width: '.9fr',  defaultVisible: false, numeric: true},
    {id: 'total_dead_larvae',label: 'Dead Larvae',     key: 'total_dead_larvae',width: '.9fr',  defaultVisible: false, numeric: true},
    {id: 'total_live_larvae',label: 'Live Larvae',     key: 'total_live_larvae',width: '.9fr',  defaultVisible: false, numeric: true},
];

// DPH is a larvae property — look it up from the larvae records by egg bowl id.
// Blank for bowls with no larvae (not yet hatched, or died).
const DPH_BY_EGG_BOWL = Object.fromEntries(LARVAE_COHORTS.map(c => [c.eggBowl, c.dph]));

const DEFAULT_FILTER = {dateFrom: '', dateTo: ''};

function buildTheme(cols) {
    return {
        Table: `--data-table-library_grid-template-columns: ${cols.map(c => `minmax(0px, ${c.width})`).join(' ')} !important`,
    };
}

function fmt(val) {
    if (val === null || val === undefined || val === '') return '';
    return val;
}

function EggBowlsFilter({holder, setHolder}) {
    return (
        <div className="input-area">
            <Row>
                <Col><span>Spawn date from:</span></Col>
                <Col>
                    <Input type="date" bsSize="sm"
                           value={holder.dateFrom}
                           onChange={e => setHolder(h => ({...h, dateFrom: e.target.value}))}/>
                </Col>
            </Row>
            <Row>
                <Col><span>Spawn date to:</span></Col>
                <Col>
                    <Input type="date" bsSize="sm"
                           value={holder.dateTo}
                           onChange={e => setHolder(h => ({...h, dateTo: e.target.value}))}/>
                </Col>
            </Row>
        </div>
    );
}

export default function EggBowls() {
    const [searchParams] = useSearchParams();
    const [appliedFilter, setAppliedFilter] = useState(DEFAULT_FILTER);
    const [filterHolder, setFilterHolder] = useState(DEFAULT_FILTER);
    const [search, setSearch] = useState(searchParams.get('egg_bowl_id') ?? '');
    const [searchFocus, setSearchFocus] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [showColSelector, setShowColSelector] = useState(false);
    const [visibleCols, setVisibleCols] = useState(
        () => new Set(ALL_COLS.filter(c => c.defaultVisible).map(c => c.id))
    );
    const [alertText, setAlertText] = useState('');
    const [alertLevel, setAlertLevel] = useState('');

    const cols = ALL_COLS.filter(c => visibleCols.has(c.id));
    const theme = useTheme([buildTheme(cols), getTheme()]);

    const q = search.toLowerCase().trim();
    // An exact egg bowl id (e.g. from a deep link) filters to that one bowl;
    // otherwise free-text substring search across all fields.
    const isExactEggId = q && EGG_BOWLS.some(b => b.egg_id.toLowerCase() === q);
    const filtered = EGG_BOWLS
        .filter(row => {
            if (appliedFilter.dateFrom && row.spawn_date < appliedFilter.dateFrom) return false;
            if (appliedFilter.dateTo && row.spawn_date > appliedFilter.dateTo) return false;
            if (q) {
                if (isExactEggId) {
                    if (row.egg_id.toLowerCase() !== q) return false;
                } else if (!Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(q))) {
                    return false;
                }
            }
            return true;
        })
        // DPH looked up from larvae records; blank when no larvae exist for this bowl.
        .map(row => ({...row, current_age_dph: DPH_BY_EGG_BOWL[row.egg_id] ?? ''}));

    const toggleCol = (id) => {
        setVisibleCols(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div className="wrapper">
            <Container id="amphi-table-wrapper">
                <Row className="amphi-table-wrapper-header">
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                    <FishDataUpload dataUploadUrl="egg_bowls/bulk_upload"
                                    uploadCallback={() => {}}
                                    formModalTitle="Upload Egg Bowl Data"
                                    uploadButtonText="Upload Egg Bowl Data"
                                    setAlertText={setAlertText}
                                    setAlertLevel={setAlertLevel}
                    />
                </Row>
                <Row>
                    <div className="amphi-table-container">
                        <div className="amphi-table-search-paginate">
                            <div className="amphi-table-search">
                                <InputGroup
                                    onFocus={() => setSearchFocus(true)}
                                    onBlur={() => setSearchFocus(false)}
                                    className={classnames({'input-group-focus': searchFocus})}>
                                    <div className="input-group-prepend">
                                        <InputGroupText>
                                            <i className="tim-icons icon-zoom-split"/>
                                        </InputGroupText>
                                    </div>
                                    <Input
                                        placeholder="Search"
                                        type="text"
                                        autoComplete="off"
                                        onChange={e => setSearch(e.target.value)}
                                        value={search}
                                    />
                                    <div className="input-group-append">
                                        <InputGroupText>
                                            <i className="amphi-icon icon-filter clickable"
                                               style={showFilter ? {display: 'none'} : {}}
                                               onClick={() => { setShowFilter(true); setShowColSelector(false); }}/>
                                        </InputGroupText>
                                    </div>
                                </InputGroup>

                                {showFilter && (
                                    <div style={{width: '550px'}} className="filter">
                                        <div style={{border: '1px solid #1d8cf8', padding: '10px'}}>
                                            <EggBowlsFilter holder={filterHolder} setHolder={setFilterHolder}/>
                                            <Row style={{margin: 0}}>
                                                <div style={{display: 'flex'}}>
                                                    <Button type="button" onClick={() => setShowFilter(false)}>Close</Button>
                                                </div>
                                                <div style={{display: 'flex', marginLeft: 'auto'}}>
                                                    <Button type="button" onClick={() => {
                                                        setShowFilter(false);
                                                        setAppliedFilter(filterHolder);
                                                    }}>Search</Button>
                                                </div>
                                            </Row>
                                        </div>
                                    </div>
                                )}

                                <Pagination className="pagination">
                                    <PaginationItem>
                                        <span className="item-count">
                                            {filtered.length > 0 ? `1-${filtered.length}` : '0'} of {filtered.length}
                                        </span>
                                    </PaginationItem>
                                </Pagination>
                            </div>
                        </div>

                        <div className="amphi-table-inner">
                            <i className={classnames("tim-icons icon-bullet-list-67 clickable",
                                   showColSelector && "text-info")}
                               style={{position: 'absolute', top: '11px', right: '15px', zIndex: 10, fontSize: '0.9rem'}}
                               onClick={() => { setShowColSelector(s => !s); setShowFilter(false); }}/>
                            {showColSelector && (
                                <div style={{position: 'absolute', top: '35px', right: '0', zIndex: 100,
                                             width: '320px', border: '1px solid #1d8cf8', padding: '10px',
                                             backgroundColor: '#1e1e2f'}}>
                                    <Row style={{margin: '0 0 8px 0'}}>
                                        {ALL_COLS.map(col => (
                                            <Col xs={6} key={col.id} style={{padding: '2px 8px'}}>
                                                <FormGroup check style={{margin: 0}}>
                                                    <Label check>
                                                        <Input type="checkbox"
                                                               checked={visibleCols.has(col.id)}
                                                               onChange={() => toggleCol(col.id)}/>
                                                        <span className="form-check-sign">{col.label}</span>
                                                    </Label>
                                                </FormGroup>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Row style={{margin: 0}}>
                                        <div style={{display: 'flex', marginLeft: 'auto'}}>
                                            <Button type="button" onClick={() => setShowColSelector(false)}>Close</Button>
                                        </div>
                                    </Row>
                                </div>
                            )}

                            <div className="amphi-table-header">
                                <Table data={{nodes: cols}} theme={theme} style={{marginBottom: 0}}>
                                    {(headerCols) => (
                                        <Header>
                                            <HeaderRow className="table-row">
                                                {headerCols.map(col => (
                                                    <HeaderCell key={col.id}
                                                                className={classnames({'numberCell': col.numeric})}>
                                                        <HeaderLabel colId={col.id} label={col.label}/>
                                                    </HeaderCell>
                                                ))}
                                            </HeaderRow>
                                        </Header>
                                    )}
                                </Table>
                            </div>
                            <div className="amphi-table-contents">
                                <Table data={{nodes: filtered}} theme={theme}>
                                    {(rows) => (
                                        <>
                                            <Header>
                                                <HeaderRow style={{display: 'none'}}>
                                                    {cols.map(c => <HeaderCell key={c.id}/>)}
                                                </HeaderRow>
                                            </Header>
                                            <Body>
                                                {rows.map(row => (
                                                    <TableRow key={row.id} item={row} className="table-row">
                                                        {cols.map(col => (
                                                            <Cell key={col.id}
                                                                  className={classnames({'numberCell': col.numeric})}>
                                                                {fmt(row[col.key])}
                                                            </Cell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                                <TableRow key="bottom" item={null} id="idlastrow">
                                                    <Cell className="table-bottom"
                                                          gridColumnStart={1}
                                                          gridColumnEnd={cols.length + 1}>&nbsp;</Cell>
                                                </TableRow>
                                            </Body>
                                        </>
                                    )}
                                </Table>
                            </div>
                        </div>
                    </div>
                </Row>
            </Container>
        </div>
    );
}
