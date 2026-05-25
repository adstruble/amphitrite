import React, {useState} from "react";
import {Button, Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle,
    Input, InputGroup, InputGroupText, Row} from "reactstrap";
import HeaderLabel from "../../components/Table/HeaderLabel.jsx";
import FishDataUpload from "../../components/Upload/FishDataUpload";
import AmphiAlert from "../../components/Basic/AmphiAlert";
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

const MOCK_DATA = [
    {id: '1',  date: '2026-01-06', facility: 'LFS Wet Lab', system: 'SYS 3', tank: '3A', carer: 'ZK', temp: 11.3, do_: '~5', salinity: 8.3, ph: null,  turbidity: null, ammonia: null, nitrite: null, nitrate: null, morts: 0,  notes: 'fed all tanks, 4 severe LOE in 3C, 1 in 3B, siphoned 3B, 3C'},
    {id: '2',  date: '2026-01-06', facility: 'LFS Wet Lab', system: 'SYS 3', tank: '3B', carer: 'ZK', temp: 11.3, do_: '~5', salinity: 8.3, ph: null,  turbidity: null, ammonia: null, nitrite: null, nitrate: null, morts: 3,  notes: ''},
    {id: '3',  date: '2026-01-06', facility: 'LFS Wet Lab', system: 'SYS 3', tank: '3C', carer: 'ZK', temp: 11.3, do_: '~5', salinity: 8.3, ph: null,  turbidity: null, ammonia: null, nitrite: null, nitrate: null, morts: 4,  notes: ''},
    {id: '4',  date: '2026-01-06', facility: 'LFS Wet Lab', system: 'SYS 2', tank: 'E4', carer: 'BY ZK HB', temp: null, do_: null, salinity: 5.15, ph: null,  turbidity: 5.53, ammonia: null, nitrite: null, nitrate: null, morts: null, notes: 'Added fish to AB-3, 12000 g salt. 330 mL nanno'},
    {id: '5',  date: '2026-01-07', facility: 'LFS Wet Lab', system: 'SYS 2', tank: 'E4', carer: 'JJ EB',   temp: 13.7, do_: 10.09, salinity: 4.92, ph: null, turbidity: 3.69, ammonia: 0.1, nitrite: 0.0, nitrate: 6.0, morts: 0, notes: '3 cells/day'},
    {id: '6',  date: '2026-01-09', facility: 'Charlie',     system: null,     tank: '2A', carer: '',        temp: 11.2, do_: 5.36,  salinity: 7.6,  ph: 0.0,  turbidity: null, ammonia: 0.02, nitrite: 6.0, nitrate: 10.0, morts: 0, notes: 'Oxytet bath on 2A'},
    {id: '7',  date: '2026-01-09', facility: 'Charlie',     system: null,     tank: '2B', carer: '',        temp: 11.2, do_: 5.36,  salinity: 7.6,  ph: 0.0,  turbidity: null, ammonia: 0.02, nitrite: 6.0, nitrate: 0.0,  morts: 0, notes: ''},
    {id: '8',  date: '2026-01-09', facility: 'Charlie',     system: null,     tank: '2C', carer: '',        temp: 11.2, do_: 5.36,  salinity: 7.6,  ph: 0.0,  turbidity: null, ammonia: 0.02, nitrite: 6.0, nitrate: 0.0,  morts: 0, notes: ''},
    {id: '9',  date: '2026-01-24', facility: 'Echo',        system: null,     tank: 'C11-C15', carer: 'BY', temp: 11.3, do_: 10.41, salinity: 5.6,  ph: null, turbidity: 2.47, ammonia: null, nitrite: null, nitrate: null, morts: null, notes: 'Added larvae to C11'},
    {id: '10', date: '2026-01-25', facility: 'Echo',        system: null,     tank: 'C11-C15', carer: 'KA', temp: 11.8, do_: 10.44, salinity: 5.59, ph: null, turbidity: 2.01, ammonia: null, nitrite: null, nitrate: null, morts: null, notes: 'Added larvae to C12, C13'},
    {id: '11', date: '2026-01-24', facility: 'Echo',        system: null,     tank: 'E1',      carer: 'BY', temp: 11.3, do_: 10.52, salinity: 5.25, ph: null, turbidity: 3.92, ammonia: null, nitrite: null, nitrate: null, morts: null, notes: 'Added fish FCCL Larvae'},
    {id: '12', date: '2026-01-25', facility: 'Echo',        system: null,     tank: 'E1',      carer: 'KA', temp: 11.7, do_: 10.33, salinity: 5.25, ph: null, turbidity: 4.05, ammonia: null, nitrite: null, nitrate: null, morts: null, notes: ''},
];

const FACILITIES = ['All', 'Charlie', 'Echo', 'LFS Wet Lab'];

const COLS = [
    {id: 'date',      label: 'Date',        key: 'date',      width: '1fr'},
    {id: 'facility',  label: 'Facility',    key: 'facility',  width: '1fr'},
    {id: 'system',    label: 'System',      key: 'system',    width: '.8fr'},
    {id: 'tank',      label: 'Tank',        key: 'tank',      width: '.6fr'},
    {id: 'carer',     label: 'Carer',       key: 'carer',     width: '.7fr'},
    {id: 'temp',      label: 'Temp (°C)',   key: 'temp',      width: '.7fr', numeric: true},
    {id: 'do_',       label: 'DO',          key: 'do_',       width: '.6fr', numeric: true},
    {id: 'salinity',  label: 'Salinity',    key: 'salinity',  width: '.7fr', numeric: true},
    {id: 'ph',        label: 'pH',          key: 'ph',        width: '.5fr', numeric: true},
    {id: 'turbidity', label: 'Turbidity',   key: 'turbidity', width: '.7fr', numeric: true},
    {id: 'ammonia',   label: 'Ammonia',     key: 'ammonia',   width: '.7fr', numeric: true},
    {id: 'nitrite',   label: 'Nitrite',     key: 'nitrite',   width: '.6fr', numeric: true},
    {id: 'nitrate',   label: 'Nitrate',     key: 'nitrate',   width: '.6fr', numeric: true},
    {id: 'morts',     label: 'Morts',       key: 'morts',     width: '.6fr', numeric: true},
    {id: 'notes',     label: 'Notes',       key: 'notes',     width: '2fr'},
];

const THEME = {
    Table: `--data-table-library_grid-template-columns: ${COLS.map(c => `minmax(0px, ${c.width})`).join(' ')} !important`,
};

function fmt(val) {
    if (val === null || val === undefined || val === '') return '';
    return val;
}

const DEFAULT_FILTER = {facility: 'All', dateFrom: '', dateTo: '', minMorts: ''};

function FishCareFilter({holder, setHolder}) {
    const [facilityOpen, setFacilityOpen] = useState(false);

    return (
        <div className="input-area">
            <Row>
                <Col>
                    <span>Facility:</span>
                </Col>
                <Col>
                    <Dropdown isOpen={facilityOpen} toggle={() => setFacilityOpen(o => !o)}>
                        <DropdownToggle style={{paddingTop: 0, paddingLeft: 0}}
                                        caret color="default" nav>
                            <span>{holder.facility}</span>
                        </DropdownToggle>
                        <DropdownMenu>
                            {FACILITIES.map(f => (
                                <DropdownItem key={f} onClick={() => setHolder(h => ({...h, facility: f}))}>
                                    {f}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>Date from:</span>
                </Col>
                <Col>
                    <Input type="date" bsSize="sm"
                           value={holder.dateFrom}
                           onChange={e => setHolder(h => ({...h, dateFrom: e.target.value}))}/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>Date to:</span>
                </Col>
                <Col>
                    <Input type="date" bsSize="sm"
                           value={holder.dateTo}
                           onChange={e => setHolder(h => ({...h, dateTo: e.target.value}))}/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>Min morts:</span>
                </Col>
                <Col>
                    <Input type="number" bsSize="sm" min="0" style={{width: 'auto'}}
                           value={holder.minMorts}
                           onChange={e => setHolder(h => ({...h, minMorts: e.target.value}))}/>
                </Col>
            </Row>
        </div>
    );
}

export default function FishCare() {
    const [appliedFilter, setAppliedFilter] = useState(DEFAULT_FILTER);
    const [filterHolder, setFilterHolder] = useState(DEFAULT_FILTER);
    const [search, setSearch] = useState('');
    const [searchFocus, setSearchFocus] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [alertText, setAlertText] = useState('');
    const [alertLevel, setAlertLevel] = useState('');
    const theme = useTheme([THEME, getTheme()]);

    const filtered = MOCK_DATA.filter(row => {
        if (appliedFilter.facility !== 'All' && row.facility !== appliedFilter.facility) return false;
        if (appliedFilter.dateFrom && row.date < appliedFilter.dateFrom) return false;
        if (appliedFilter.dateTo && row.date > appliedFilter.dateTo) return false;
        if (appliedFilter.minMorts !== '' && (row.morts === null || row.morts < Number(appliedFilter.minMorts))) return false;
        const q = search.toLowerCase();
        if (q && !Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(q))) return false;
        return true;
    });

    return (
        <div className="wrapper">
            <Container id="amphi-table-wrapper">

                <Row className="amphi-table-wrapper-header">
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                    <FishDataUpload dataUploadUrl="fish_care/bulk_upload"
                                    uploadCallback={() => {}}
                                    formModalTitle="Upload Fish Care Data"
                                    uploadButtonText="Upload Fish Care Data"
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
                                               onClick={() => setShowFilter(true)}/>
                                        </InputGroupText>
                                    </div>
                                </InputGroup>

                                {showFilter && (
                                    <div style={{width: '550px'}} className="filter">
                                        <div style={{border: '1px solid #1d8cf8', padding: '10px'}}>
                                            <FishCareFilter
                                                holder={filterHolder}
                                                setHolder={setFilterHolder}
                                            />
                                            <Row style={{margin: 0}}>
                                                <div style={{display: 'flex'}}>
                                                    <Button type="button" onClick={() => setShowFilter(false)}>
                                                        Close
                                                    </Button>
                                                </div>
                                                <div style={{display: 'flex', marginLeft: 'auto'}}>
                                                    <Button type="button" onClick={() => {
                                                        setShowFilter(false);
                                                        setAppliedFilter(filterHolder);
                                                    }}>
                                                        Search
                                                    </Button>
                                                </div>
                                            </Row>
                                        </div>
                                    </div>
                                )}

                                <span style={{marginTop: 'auto', marginBottom: '9px', marginLeft: '10px', color: '#888', fontSize: '0.85rem'}}>
                                    {filtered.length} records
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
                                                                {fmt(row[col.key])}
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
