import React, {useState} from "react";
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

const MOCK_DATA = [
    {id: '1',  spawn_date: '2025-12-10', cross: 'PCF-001', egg_id: 'EB-001', n_live_egg_6dpf: 412, n_mort_egg_6dpf: 38,  total_egg: 450,  fert_rate: 0.91, incubator_date: '2025-12-10', incubator_id: 'INC-1', egg_morts_16dpf: 12, total_dead_larvae: 28,  total_live_larvae: 384, total_hatched: 410, hatch_rate: 0.91, larval_tank_id: 'C11', notes: ''},
    {id: '2',  spawn_date: '2025-12-10', cross: 'PCF-002', egg_id: 'EB-002', n_live_egg_6dpf: 380, n_mort_egg_6dpf: 70,  total_egg: 450,  fert_rate: 0.84, incubator_date: '2025-12-10', incubator_id: 'INC-2', egg_morts_16dpf: 20, total_dead_larvae: 45,  total_live_larvae: 315, total_hatched: 360, hatch_rate: 0.80, larval_tank_id: 'C12', notes: ''},
    {id: '3',  spawn_date: '2025-12-14', cross: 'PCF-003', egg_id: 'EB-003', n_live_egg_6dpf: 290, n_mort_egg_6dpf: 10,  total_egg: 300,  fert_rate: 0.97, incubator_date: '2025-12-14', incubator_id: 'INC-1', egg_morts_16dpf: 5,  total_dead_larvae: 18,  total_live_larvae: 267, total_hatched: 285, hatch_rate: 0.95, larval_tank_id: 'C13', notes: 'Good viability'},
    {id: '4',  spawn_date: '2025-12-14', cross: 'PCF-004', egg_id: 'EB-004', n_live_egg_6dpf: 195, n_mort_egg_6dpf: 105, total_egg: 300,  fert_rate: 0.65, incubator_date: '2025-12-14', incubator_id: 'INC-3', egg_morts_16dpf: 30, total_dead_larvae: 60,  total_live_larvae: 105, total_hatched: 165, hatch_rate: 0.55, larval_tank_id: 'C14', notes: 'Low fert rate'},
    {id: '5',  spawn_date: '2026-01-06', cross: 'PCF-005', egg_id: 'EB-005', n_live_egg_6dpf: 540, n_mort_egg_6dpf: 60,  total_egg: 600,  fert_rate: 0.90, incubator_date: '2026-01-06', incubator_id: 'INC-2', egg_morts_16dpf: 15, total_dead_larvae: 35,  total_live_larvae: 490, total_hatched: 525, hatch_rate: 0.88, larval_tank_id: 'E1',  notes: ''},
    {id: '6',  spawn_date: '2026-01-06', cross: 'PCF-006', egg_id: 'EB-006', n_live_egg_6dpf: 460, n_mort_egg_6dpf: 40,  total_egg: 500,  fert_rate: 0.92, incubator_date: '2026-01-06', incubator_id: 'INC-4', egg_morts_16dpf: 10, total_dead_larvae: 22,  total_live_larvae: 428, total_hatched: 450, hatch_rate: 0.90, larval_tank_id: 'E2',  notes: ''},
    {id: '7',  spawn_date: '2026-01-20', cross: 'PCF-007', egg_id: 'EB-007', n_live_egg_6dpf: 320, n_mort_egg_6dpf: 80,  total_egg: 400,  fert_rate: 0.80, incubator_date: '2026-01-20', incubator_id: 'INC-1', egg_morts_16dpf: 25, total_dead_larvae: 55,  total_live_larvae: 240, total_hatched: 295, hatch_rate: 0.74, larval_tank_id: 'C15', notes: ''},
    {id: '8',  spawn_date: '2026-01-20', cross: 'PCF-008', egg_id: 'EB-008', n_live_egg_6dpf: 175, n_mort_egg_6dpf: 25,  total_egg: 200,  fert_rate: 0.88, incubator_date: '2026-01-21', incubator_id: 'INC-2', egg_morts_16dpf: 8,  total_dead_larvae: 15,  total_live_larvae: 152, total_hatched: 167, hatch_rate: 0.84, larval_tank_id: 'E3',  notes: 'Delayed incubation'},
];

const ALL_COLS = [
    {id: 'spawn_date',       label: 'Spawn Date',      key: 'spawn_date',       width: '1fr',   defaultVisible: true},
    {id: 'egg_id',           label: 'Egg Bowl ID',     key: 'egg_id',           width: '1fr',   defaultVisible: true},
    {id: 'cross',            label: 'Cross',           key: 'cross',            width: '.8fr',  defaultVisible: true},
    {id: 'total_egg',        label: 'Total Eggs',      key: 'total_egg',        width: '.7fr',  defaultVisible: true,  numeric: true},
    {id: 'fert_rate',        label: 'Fert Rate',       key: 'fert_rate',        width: '.7fr',  defaultVisible: true,  numeric: true},
    {id: 'incubator_date',   label: 'Incubator Date',  key: 'incubator_date',   width: '1fr',   defaultVisible: true},
    {id: 'incubator_id',     label: 'Incubator ID',    key: 'incubator_id',     width: '.8fr',  defaultVisible: true},
    {id: 'total_hatched',    label: 'Total Hatched',   key: 'total_hatched',    width: '.8fr',  defaultVisible: true,  numeric: true},
    {id: 'hatch_rate',       label: 'Hatch Rate',      key: 'hatch_rate',       width: '.7fr',  defaultVisible: true,  numeric: true},
    {id: 'larval_tank_id',   label: 'Larval Tank',     key: 'larval_tank_id',   width: '.8fr',  defaultVisible: true},
    {id: 'current_age_dph',  label: 'Current Age (DPH)', key: 'current_age_dph', width: '.9fr', defaultVisible: true, numeric: true},
    {id: 'notes',            label: 'Notes',           key: 'notes',            width: '2fr',   defaultVisible: true},
    {id: 'n_live_egg_6dpf',  label: 'Live Eggs 6dpf',  key: 'n_live_egg_6dpf',  width: '.9fr',  defaultVisible: false, numeric: true},
    {id: 'n_mort_egg_6dpf',  label: 'Mort Eggs 6dpf',  key: 'n_mort_egg_6dpf',  width: '.9fr',  defaultVisible: false, numeric: true},
    {id: 'egg_morts_16dpf',  label: 'Egg Morts 16dpf', key: 'egg_morts_16dpf',  width: '.9fr',  defaultVisible: false, numeric: true},
    {id: 'total_dead_larvae',label: 'Dead Larvae',     key: 'total_dead_larvae',width: '.9fr',  defaultVisible: false, numeric: true},
    {id: 'total_live_larvae',label: 'Live Larvae',     key: 'total_live_larvae',width: '.9fr',  defaultVisible: false, numeric: true},
];

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function calcDph(spawnDate) {
    const spawn = new Date(spawnDate + 'T00:00:00');
    return Math.floor((TODAY - spawn) / (1000 * 60 * 60 * 24));
}

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
    const [appliedFilter, setAppliedFilter] = useState(DEFAULT_FILTER);
    const [filterHolder, setFilterHolder] = useState(DEFAULT_FILTER);
    const [search, setSearch] = useState('');
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

    const filtered = MOCK_DATA
        .filter(row => {
            if (appliedFilter.dateFrom && row.spawn_date < appliedFilter.dateFrom) return false;
            if (appliedFilter.dateTo && row.spawn_date > appliedFilter.dateTo) return false;
            const q = search.toLowerCase();
            if (q && !Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(q))) return false;
            return true;
        })
        .map(row => ({...row, current_age_dph: calcDph(row.spawn_date)}));

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
