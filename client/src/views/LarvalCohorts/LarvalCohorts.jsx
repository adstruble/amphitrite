import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button, Col, Input, InputGroup, InputGroupText, Row} from "reactstrap";
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
import {Container} from "reactstrap";
import FishDataUpload from "../../components/Upload/FishDataUpload";
import AmphiAlert from "../../components/Basic/AmphiAlert";
import {LARVAE_COHORTS} from "./larvalCohortData.js";

const COLS = [
    {id: 'spawnDate', label: 'Spawn Date',       key: 'spawnDate', width: '1fr'},
    {id: 'cross',     label: 'Cross',            key: 'cross',     width: '.6fr', numeric: true},
    {id: 'eggBowl',   label: 'Egg Bowl ID',      key: 'eggBowl',   width: '1fr'},
    {id: 'tank',      label: 'Tank ID',          key: 'tank',      width: '1fr'},
    {id: 'dph',       label: 'Current Age (DPH)', key: 'dph',      width: '1fr', numeric: true},
    {id: 'stage',     label: 'Feed Stage',       key: 'stage',     width: '1.1fr'},
];

const THEME = {
    Table: `--data-table-library_grid-template-columns: ${COLS.map(c => `minmax(0px, ${c.width})`).join(' ')} !important`,
};

const DEFAULT_FILTER = {dateFrom: '', dateTo: ''};

function CohortFilter({holder, setHolder}) {
    return (
        <div className="input-area">
            <Row>
                <Col><span>Spawn date from:</span></Col>
                <Col>
                    <Input type="date" bsSize="sm" value={holder.dateFrom}
                           onChange={e => setHolder(h => ({...h, dateFrom: e.target.value}))}/>
                </Col>
            </Row>
            <Row>
                <Col><span>Spawn date to:</span></Col>
                <Col>
                    <Input type="date" bsSize="sm" value={holder.dateTo}
                           onChange={e => setHolder(h => ({...h, dateTo: e.target.value}))}/>
                </Col>
            </Row>
        </div>
    );
}

export default function LarvalCohorts() {
    const navigate = useNavigate();
    const [appliedFilter, setAppliedFilter] = useState(DEFAULT_FILTER);
    const [filterHolder, setFilterHolder] = useState(DEFAULT_FILTER);
    const [search, setSearch] = useState('');
    const [searchFocus, setSearchFocus] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [alertText, setAlertText] = useState('');
    const [alertLevel, setAlertLevel] = useState('');
    const theme = useTheme([THEME, getTheme()]);

    const filtered = LARVAE_COHORTS.filter(row => {
        if (appliedFilter.dateFrom && row.spawnDate < appliedFilter.dateFrom) return false;
        if (appliedFilter.dateTo && row.spawnDate > appliedFilter.dateTo) return false;
        const q = search.toLowerCase();
        if (q && !Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(q))) return false;
        return true;
    });

    function renderCell(row, col) {
        const val = row[col.key];
        if (val === null || val === undefined || val === '') return '';
        if (col.key === 'eggBowl') {
            return <span className="text-info" style={{cursor: 'pointer'}}
                         onClick={() => navigate(`/eggbowls?egg_bowl_id=${encodeURIComponent(val)}`)}>{val}</span>;
        }
        return val;
    }

    return (
        <div className="wrapper">
            <Container id="amphi-table-wrapper">
                <Row className="amphi-table-wrapper-header">
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                    <FishDataUpload dataUploadUrl="larvae/bulk_upload"
                                    uploadCallback={() => {}}
                                    formModalTitle="Upload Larvae Current Ages"
                                    uploadButtonText="Upload Larvae Data"
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
                                    <Input placeholder="Search" type="text" autoComplete="off"
                                           onChange={e => setSearch(e.target.value)} value={search}/>
                                    <div className="input-group-append">
                                        <InputGroupText>
                                            <i className="amphi-icon icon-filter clickable"
                                               style={showFilter ? {display: 'none'} : {}}
                                               onClick={() => setShowFilter(true)}/>
                                        </InputGroupText>
                                    </div>
                                </InputGroup>

                                {showFilter && (
                                    <div style={{width: '550px'}} className="filter">
                                        <div style={{border: '1px solid #1d8cf8', padding: '10px'}}>
                                            <CohortFilter holder={filterHolder} setHolder={setFilterHolder}/>
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

                                <span style={{marginTop: 'auto', marginBottom: '9px', marginLeft: '10px', color: '#888', fontSize: '0.85rem'}}>
                                    {filtered.length} cohorts
                                </span>
                            </div>
                        </div>

                        <div className="amphi-table-inner">
                            <div className="amphi-table-header">
                                <Table data={{nodes: COLS}} theme={theme} style={{marginBottom: 0}}>
                                    {(cols) => (
                                        <Header>
                                            <HeaderRow className="table-row">
                                                {cols.map(col => (
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
                                                    {COLS.map(c => <HeaderCell key={c.id}/>)}
                                                </HeaderRow>
                                            </Header>
                                            <Body>
                                                {rows.map(row => (
                                                    <TableRow key={row.id} item={row} className="table-row">
                                                        {COLS.map(col => (
                                                            <Cell key={col.id}
                                                                  className={classnames({'numberCell': col.numeric})}>
                                                                {renderCell(row, col)}
                                                            </Cell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                                <TableRow key="bottom" item={null} id="idlastrow">
                                                    <Cell className="table-bottom"
                                                          gridColumnStart={1}
                                                          gridColumnEnd={COLS.length + 1}>&nbsp;</Cell>
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
