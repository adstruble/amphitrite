import React, {useMemo, useState} from "react";
import {Container, Row} from "reactstrap";
import AmphiTable from "../../components/Table/AmphiTable";
import AmphiAlert from "../../components/Basic/AmphiAlert";
import ColumnSelector from "../../components/Table/ColumnSelector";
import FishDataUpload from "../../components/Upload/FishDataUpload";
import GoogleSheetSync from "../../components/Upload/GoogleSheetSync";
import {formatStr} from "../../components/Utils/FormatFunctions";
import {FishCareFilter} from "./FishCareFilter";

// Module-level (stable object refs): AmphiTable mutates these column objects in place to track
// sort state, so keeping them stable lets an active sort survive a column show/hide toggle.
// tooltip: true → truncated cells show the full value on hover. order_by is the DB sort column.
const ALL_COLS = [
    {name: 'Date',      key: 'obs_date',         order_by: 'obs_date',         order: 1,    order_direction: 'DESC', format_fn: formatStr, tooltip: true, width: '1.2fr'},
    {name: 'Facility',  key: 'facility',         order_by: 'facility',         order: null, order_direction: null, format_fn: formatStr, tooltip: true, width: '1.3fr'},
    {name: 'System',    key: 'system',           order_by: 'system',           order: null, order_direction: null, format_fn: formatStr, width: '1fr'},
    {name: 'Tank',      key: 'tank_id',          order_by: 'tank_id',          order: null, order_direction: null, format_fn: formatStr, tooltip: true, width: '.9fr'},
    {name: 'Carer',     key: 'carer',            order_by: 'carer',            order: null, order_direction: null, format_fn: formatStr, width: '.9fr'},
    {name: 'Temp',      key: 'temp',             order_by: 'temp',             order: null, order_direction: null, format_fn: formatStr, className: 'numberCell', header_tooltip: 'Temperature (°C)', width: '.9fr'},
    {name: 'DO',        key: 'dissolved_oxygen', order_by: 'dissolved_oxygen', order: null, order_direction: null, format_fn: formatStr, className: 'numberCell', header_tooltip: 'Dissolved oxygen', width: '.8fr'},
    {name: 'Salinity',  key: 'salinity',         order_by: 'salinity',         order: null, order_direction: null, format_fn: formatStr, className: 'numberCell', width: '1fr'},
    {name: 'pH',        key: 'ph',               order_by: 'ph',               order: null, order_direction: null, format_fn: formatStr, className: 'numberCell', width: '.8fr'},
    {name: 'Turbidity', key: 'turbidity',        order_by: 'turbidity',        order: null, order_direction: null, format_fn: formatStr, className: 'numberCell', width: '1.1fr'},
    {name: 'Ammonia',   key: 'ammonia',          order_by: 'ammonia',          order: null, order_direction: null, format_fn: formatStr, className: 'numberCell', width: '1fr'},
    {name: 'Nitrite',   key: 'nitrite',          order_by: 'nitrite',          order: null, order_direction: null, format_fn: formatStr, className: 'numberCell', width: '.9fr'},
    {name: 'Nitrate',   key: 'nitrate',          order_by: 'nitrate',          order: null, order_direction: null, format_fn: formatStr, className: 'numberCell', width: '.9fr'},
    {name: 'Morts',     key: 'morts',            order_by: 'morts',            order: null, order_direction: null, format_fn: formatStr, className: 'numberCell', width: '.9fr'},
    {name: 'Notes',     key: 'notes',            order_by: 'notes',            order: null, order_direction: null, format_fn: formatStr, tooltip: true, width: '2.2fr'},
];

// Columns hidden on first load (still toggleable in the column selector).
const DEFAULT_HIDDEN = new Set(['ph', 'system']);

export default function FishCare() {
    const [reloadTable, setReloadTable] = useState(0);
    const [alertText, setAlertText] = useState('');
    const [alertLevel, setAlertLevel] = useState('');
    const [visibleKeys, setVisibleKeys] = useState(
        () => new Set(ALL_COLS.filter(c => !DEFAULT_HIDDEN.has(c.key)).map(c => c.key)));
    // Bumped on column toggle so AmphiTable re-reads its column list from headerDataStart.
    const [headerVersion, setHeaderVersion] = useState(0);

    const reload = () => setReloadTable(v => v + 1);

    const toggleColumn = (key) => {
        setVisibleKeys(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
        setHeaderVersion(v => v + 1);
    };

    // Filter preserves the original column object references (see note above).
    const headerDataStart = useMemo(
        () => ({rows: {}, cols: ALL_COLS.filter(c => visibleKeys.has(c.key))}),
        [visibleKeys]);

    const columnSelector = (
        <ColumnSelector columns={ALL_COLS} visibleKeys={visibleKeys} onToggle={toggleColumn}/>
    );

    return (
        <div className="wrapper">
            <Container id="amphi-table-wrapper">
                <Row className="amphi-table-wrapper-header">
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                    <GoogleSheetSync previewUrl="fish_care/sheets_preview"
                                     commitUrl="fish_care/sheets_commit"
                                     buttonText="Sync from Google Sheets"
                                     modalTitle="Sync Fish Care Data"
                                     setAlertText={setAlertText}
                                     setAlertLevel={setAlertLevel}
                                     onCommitted={reload}
                    />
                    <FishDataUpload dataUploadUrl="fish_care/bulk_upload"
                                    uploadCallback={reload}
                                    formModalTitle="Upload Fish Care Data"
                                    uploadButtonText="Upload Fish Care Data"
                                    setAlertText={setAlertText}
                                    setAlertLevel={setAlertLevel}
                    />
                </Row>
                <Row>
                    <AmphiTable tableDataUrl="fish_care/get_records"
                                reloadData={reloadTable}
                                headerDataStart={headerDataStart}
                                filter={FishCareFilter}
                                tableControl={columnSelector}
                                updateHeaders={headerVersion}
                                LIMIT={500}
                                calcHeaderHeight={true}
                    />
                </Row>
            </Container>
        </div>
    );
}
