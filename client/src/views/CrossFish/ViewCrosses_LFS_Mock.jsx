import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button, Col, Container, Input, InputGroup, InputGroupText,
    Pagination, PaginationItem, Row} from "reactstrap";
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
import AmphiAlert from "../../components/Basic/AmphiAlert";
import AmphiHeaderCell from "../../components/Table/AmphiHeaderCell.jsx";
import {CrossYearDropdown} from "../../components/Basic/CrossYearDropdown";
import {ImportExportDropdown} from "../../components/Basic/ImportExportDropdown.jsx";
import FishDataUpload from "../../components/Upload/FishDataUpload";

const MOCK_DATA = [
    {
        id: '1', cross_num: 1, f_gid: 'WT', m_gid: 'WT', f_fish_id: 'W001', m_fish_id: 'W000',
        cross_date: '2025-12-11', f: 0.0312, di: 0.8821, f_crosses: 1, m_crosses: 1,
        egg_bowl_id: 'EB1', cross_failed: false, notes: '',
        f_facility: 'FCCL',   f_age: '2 Year Old', f_gen: 'Wild', f_collect_year: '2025-2026', f_collect_source: 'USF&W', f_pre_mass: 9.88,  f_post_mass: null,  f_fl: 108, f_tl: null, f_notes: '',
        m_facility: 'FCCL',   m_age: '2 Year Old', m_gen: 'Wild', m_collect_year: '2025-2026', m_collect_source: 'USF&W', m_pre_mass: 10.39, m_post_mass: null,  m_fl: 108, m_tl: null, m_notes: '',
    },
    {
        id: '2', cross_num: 2, f_gid: 'WT', m_gid: 'WT', f_fish_id: 'W002', m_fish_id: 'W003',
        cross_date: '2025-12-12', f: 0.0289, di: 0.8754, f_crosses: 1, m_crosses: 2,
        egg_bowl_id: 'EB2', cross_failed: false, notes: '',
        f_facility: 'FCCL',   f_age: '2 Year Old', f_gen: 'Wild', f_collect_year: '2025-2026', f_collect_source: 'USF&W', f_pre_mass: 8.88,  f_post_mass: null,  f_fl: 105, f_tl: null, f_notes: '',
        m_facility: 'FCCL',   m_age: '2 Year Old', m_gen: 'Wild', m_collect_year: '2025-2026', m_collect_source: 'USF&W', m_pre_mass: 9.53,  m_post_mass: null,  m_fl: 104, m_tl: null, m_notes: '',
    },
    {
        id: '3', cross_num: 5, f_gid: 'WT', m_gid: 'WT', f_fish_id: 'W006', m_fish_id: 'W007',
        cross_date: '2025-12-12', f: 0.0401, di: 0.8612, f_crosses: 1, m_crosses: 1,
        egg_bowl_id: 'EB3', cross_failed: false, notes: '',
        f_facility: 'FCCL',   f_age: '2 Year Old', f_gen: 'Wild', f_collect_year: '2025-2026', f_collect_source: 'USF&W', f_pre_mass: 10.99, f_post_mass: null,  f_fl: 103, f_tl: null, f_notes: '',
        m_facility: 'FCCL',   m_age: '2 Year Old', m_gen: 'Wild', m_collect_year: '2025-2026', m_collect_source: 'USF&W', m_pre_mass: 10.39, m_post_mass: null,  m_fl: 108, m_tl: null, m_notes: '',
    },
    {
        id: '4', cross_num: 10, f_gid: 'WT', m_gid: 'WT', f_fish_id: 'W034', m_fish_id: 'W035',
        cross_date: '2025-12-15', f: 0.0156, di: 0.9102, f_crosses: 1, m_crosses: 1,
        egg_bowl_id: 'EB8', cross_failed: true, notes: '',
        f_facility: 'FCCL',   f_age: '2 Year Old', f_gen: 'Wild', f_collect_year: '2025-2026', f_collect_source: 'USF&W', f_pre_mass: 8.92,  f_post_mass: null,  f_fl: 105, f_tl: null, f_notes: 'Unfertilized',
        m_facility: 'FCCL',   m_age: '2 Year Old', m_gen: 'Wild', m_collect_year: '2025-2026', m_collect_source: 'USF&W', m_pre_mass: 11.02, m_post_mass: null,  m_fl: 110, m_tl: null, m_notes: '',
    },
    {
        id: '5', cross_num: 28, f_gid: 'WT', m_gid: 'WT', f_fish_id: 'LFS-12/18/25-F-EB5', m_fish_id: 'LFS-12/18/25-M-EB5',
        cross_date: '2025-12-18', f: 0.0198, di: 0.8934, f_crosses: 1, m_crosses: 1,
        egg_bowl_id: 'EB5', cross_failed: false, notes: '',
        f_facility: 'PCF/AS', f_age: '2 Year Old', f_gen: 'Wild', f_collect_year: '2025-2026', f_collect_source: 'OGFL',  f_pre_mass: 15.75, f_post_mass: 13.47, f_fl: 125, f_tl: 131, f_notes: '',
        m_facility: 'PCF/AS', m_age: '2 Year Old', m_gen: 'Wild', m_collect_year: '2025-2026', m_collect_source: 'OGFL',  m_pre_mass: 12.56, m_post_mass: 12.22, m_fl: 113, m_tl: 121, m_notes: 'Decent Milt',
    },
    {
        id: '6', cross_num: 31, f_gid: 'WT', m_gid: 'WT', f_fish_id: 'LFS-12/19/25-F-EB6', m_fish_id: 'LFS-12/19/25-M-EB6',
        cross_date: '2025-12-19', f: 0.0267, di: 0.8801, f_crosses: 2, m_crosses: 1,
        egg_bowl_id: 'EB6', cross_failed: false, notes: '',
        f_facility: 'PCF/AS', f_age: '2 Year Old', f_gen: 'Wild', f_collect_year: '2025-2026', f_collect_source: 'OGFL',  f_pre_mass: 15.67, f_post_mass: 13.7,  f_fl: 124, f_tl: 139, f_notes: '',
        m_facility: 'PCF/AS', m_age: '2 Year Old', m_gen: 'Wild', m_collect_year: '2025-2026', m_collect_source: 'OGFL',  m_pre_mass: 13.37, m_post_mass: 13.0,  m_fl: 115, m_tl: 126, m_notes: 'Decent Milt',
    },
];

const COLS = [
    {key: 'edit',       name: '',                    className: '',           width: '.3fr'},
    {key: 'cross_num',  name: 'PC/FSG',              className: 'numberCell', width: '.7fr'},
    {key: 'f_gid',      name: 'Female PC/FSG',       className: 'numberCell', width: '.8fr'},
    {key: 'f_fish_id',  name: 'Female Fish',         className: '',           width: '1.4fr'},
    {key: 'm_gid',      name: 'Male PC/FSG',         className: 'numberCell', width: '.8fr'},
    {key: 'm_fish_id',  name: 'Male Fish',           className: '',           width: '1.4fr'},
    {key: 'cross_date', name: 'Cross Date',          className: 'numberCell', width: '1fr'},
    {key: 'f',          name: 'F',                   className: 'numberCell', width: '.7fr'},
    {key: 'di',         name: 'DI',                  className: 'numberCell', width: '.7fr'},
    {key: 'f_crosses',  name: 'Female PC/FSG Crosses Completed', className: 'numberCell', width: '.9fr'},
    {key: 'm_crosses',  name: 'Male PC/FSG Crosses Completed',  className: 'numberCell', width: '.9fr'},
    {key: 'egg_bowl_id',name: 'Egg Bowl ID',         className: '',           width: '.8fr'},
];

const THEME = {
    Table: `--data-table-library_grid-template-columns: ${COLS.map(c => `minmax(0px, ${c.width})`).join(' ')} !important`,
};

function fmt(val) {
    if (val === null || val === undefined || val === '') return '';
    return val;
}

const DEFAULT_FILTER = {dateFrom: '', dateTo: ''};

function SpawningFilter({holder, setHolder}) {
    return (
        <div className="input-area">
            <Row>
                <Col><span>Date from:</span></Col>
                <Col>
                    <Input type="date" bsSize="sm" value={holder.dateFrom}
                           onChange={e => setHolder(h => ({...h, dateFrom: e.target.value}))}/>
                </Col>
            </Row>
            <Row>
                <Col><span>Date to:</span></Col>
                <Col>
                    <Input type="date" bsSize="sm" value={holder.dateTo}
                           onChange={e => setHolder(h => ({...h, dateTo: e.target.value}))}/>
                </Col>
            </Row>
        </div>
    );
}

function ExpandedRow({item}) {
    const [notes, setNotes] = useState(item.notes || '');

    function DetailSection({prefix, label}) {
        const rows = [
            ['Facility',          item[prefix + 'facility']],
            ['Age',               item[prefix + 'age']],
            ['Generation',        item[prefix + 'gen']],
            ['Collect Year',      item[prefix + 'collect_year']],
            ['Collect Source',    item[prefix + 'collect_source']],
            ['Pre Mass (g)',      item[prefix + 'pre_mass']],
            ['Post Mass (g)',     item[prefix + 'post_mass']],
            ['Fork Length (mm)',  item[prefix + 'fl']],
            ['Total Length (mm)', item[prefix + 'tl']],
            ['Notes',             item[prefix + 'notes']],
        ].filter(([, val]) => val !== null && val !== undefined && val !== '');

        return (
            <Col>
                <h6 style={{color: '#1d8cf8', marginBottom: '8px'}}>{label}</h6>
                <table style={{fontSize: '0.85rem', width: '100%'}}>
                    <tbody>
                        {rows.map(([lbl, val]) => (
                            <tr key={lbl}>
                                <td style={{color: '#aaa', paddingRight: '12px', whiteSpace: 'nowrap'}}>{lbl}</td>
                                <td>{val}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Col>
        );
    }

    return (
        <tr className="expanded-row-contents">
            <td>
                <Row style={{padding: '8px 16px'}}>
                    <DetailSection prefix="f_" label="Female"/>
                    <DetailSection prefix="m_" label="Male"/>
                    <Col>
                        <h6 style={{color: '#1d8cf8', marginBottom: '8px'}}>Notes</h6>
                        <Input type="textarea" rows="3" value={notes}
                               onChange={e => setNotes(e.target.value)}/>
                    </Col>
                </Row>
            </td>
        </tr>
    );
}

export default function ViewCrossesLFSMock() {
    const navigate = useNavigate();
    const [appliedFilter, setAppliedFilter] = useState(DEFAULT_FILTER);
    const [filterHolder, setFilterHolder] = useState(DEFAULT_FILTER);
    const [search, setSearch] = useState('');
    const [searchFocus, setSearchFocus] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [alertText, setAlertText] = useState('');
    const [alertLevel, setAlertLevel] = useState('');
    const [completedCrossesYear, setCompletedCrossesYear] = useState(new Date().getFullYear());
    const [showUpload, setShowUpload] = useState(false);
    const meanF = 0.031250;
    const theme = useTheme([THEME, getTheme()]);

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const filtered = MOCK_DATA.filter(row => {
        if (appliedFilter.dateFrom && row.cross_date < appliedFilter.dateFrom) return false;
        if (appliedFilter.dateTo && row.cross_date > appliedFilter.dateTo) return false;
        const q = search.toLowerCase();
        if (q && !Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(q))) return false;
        return true;
    });

    function renderCell(row, col) {
        switch (col.key) {
            case 'edit':
                return <i className="amphi-icon icon-hide clickable" onClick={() => toggleExpand(row.id)}/>;
            case 'f':
            case 'di':
                return row[col.key] != null ? row[col.key].toFixed(3) : '';
            case 'egg_bowl_id':
                return row.egg_bowl_id
                    ? <span className="text-info" style={{cursor: 'pointer'}}
                            onClick={() => navigate(`/eggbowls?egg_bowl_id=${encodeURIComponent(row.egg_bowl_id)}`)}>
                          {row.egg_bowl_id}
                      </span>
                    : '';
            default:
                return fmt(row[col.key]);
        }
    }

    return (
        <div className={classnames('wrapper', 'view-fish')}>
            <Container id="amphi-table-wrapper">
                <Row className="amphi-table-wrapper-header">
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                </Row>
                <Row className="amphi-table-wrapper-header">
                    <Col className="input-area">
                        <Row>
                            <Col><span>Cross completion year:</span></Col>
                            <Col>
                                <CrossYearDropdown yearSelectedCallback={setCompletedCrossesYear}/>
                            </Col>
                        </Row>
                    </Col>
                    <Col className="inbreeding-coefficients">
                        <Row>
                            <span>Population Inbreeding Coefficient (Mean F)</span>
                        </Row>
                        <Row>
                            <span className="inbreeding-coefficients-value">{completedCrossesYear}: {meanF.toFixed(6)}</span>
                        </Row>
                    </Col>
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
                                            <SpawningFilter holder={filterHolder} setHolder={setFilterHolder}/>
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
                                <ImportExportDropdown importExportItems={[
                                    {name: 'Import spawning data', callback: () => setShowUpload(true), export: false},
                                    {name: 'Export completed crosses as pairs', callback: () => {}, export: true},
                                    {name: 'Export single fish of completed crosses (parentage analysis)', callback: () => {}, export: true},
                                ]}/>
                            </div>
                        </div>

                        <div className="amphi-table-inner">
                            <div className="amphi-table-header">
                                <Table data={{nodes: COLS}} theme={theme} style={{marginBottom: 0}}>
                                    {(cols) => (
                                        <Header>
                                            <HeaderRow className="table-row">
                                                {cols.map(col => (
                                                    <AmphiHeaderCell key={col.key}
                                                                     header={{key: col.key, name: col.name, className: col.className}}
                                                                     updateOrderBy={() => {}}/>
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
                                                    {COLS.map(c => <HeaderCell key={c.key}/>)}
                                                </HeaderRow>
                                            </Header>
                                            <Body>
                                                {rows.map(row => (
                                                    <React.Fragment key={row.id}>
                                                        <TableRow item={row}
                                                                  className={classnames('table-row',
                                                                      {'expanded': expandedIds.has(row.id)},
                                                                      {'row-line-through': row.cross_failed})}>
                                                            {COLS.map(col => (
                                                                <Cell key={col.key} className={col.className}>
                                                                    {renderCell(row, col)}
                                                                </Cell>
                                                            ))}
                                                        </TableRow>
                                                        {expandedIds.has(row.id) && <ExpandedRow item={row}/>}
                                                    </React.Fragment>
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
                <FishDataUpload dataUploadUrl="spawning_events/bulk_upload"
                                uploadCallback={() => {}}
                                formModalTitle="Upload Spawning Data"
                                uploadButtonText="Upload Spawning Data"
                                setAlertText={setAlertText}
                                setAlertLevel={setAlertLevel}
                                showButton={false}
                                showFormModalFromParent={showUpload}
                                setShowFormModalFromParent={setShowUpload}
                />
            </Container>
        </div>
    );
}
