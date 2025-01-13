import classnames from "classnames";
import {
    Button,
    Col,
    Container, Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Row
} from "reactstrap";
import AmphiAlert from "../../components/Basic/AmphiAlert";
import React,{useState} from "react";
import AmphiTable from "../../components/Table/AmphiTable";
import {
    formatCheckbox,
    formatDate,
    formatDoubleTo3,
    formatStr, formatTextWithIcon
} from "../../components/Utils/FormatFunctions";
import ViewCrossesExpanded from "./ViewCrossesExpanded";
import fetchFile from "../../server/fetchFile";
import useToken from "../../components/App/useToken";
import {CrossYearDropdown} from "../../components/Basic/CrossYearDropdown";
import {ViewCrossesFilter} from "./ViewCrossesFilter";


export default function ViewCrosses(){
    const BOTH_CROSSES_COLS =
        [{name: "Female PC/FSG", key: "x_gid",  visible: true, format_fn: formatStr, width:".8fr", className:"numberCell",
            order:2, order_direction: "", order_by: "xf.group_id"},
        {name: "Female Fish", key: "f_tag", visible: true, format_fn: formatStr, width:".8fr", format_args: '_x',
            order:2, order_direction: "", order_by: "f_tag"},
        {name: "Male PC/FSG", key: "y_gid",  visible: true, format_fn: formatStr, width:".8fr", className:"numberCell",
            order:2, order_direction: "", order_by: "yf.group_id"},
        {name: "Male Fish", key: "m_tag", visible: true, format_fn: formatStr, width:".8fr", format_args:'_y',
            order:2, order_direction: "", order_by: "m_tag"},
        {name: "Cross Date", key: "cross_date", visible: true, format_fn: formatDate, width: ".9fr",
            order:2, order_direction: "", order_by: "cross_date"},
        {name: "F", key: "f", visible: true, format_fn: formatDoubleTo3, width:".9fr", className:"numberCell",
            order:2, order_direction: "", order_by: "f"},
        {name: "DI", key: "di", visible: true, format_fn: formatDoubleTo3, width:".9fr", className:"numberCell",
            order:2, order_direction: "", order_by: "di"},
        {name: "Female PC/FSG Crosses Completed", key: "x_crosses", visible: true, format_fn: formatStr, width:".9fr",
            className:"numberCell", order:2, order_direction: "", order_by: "x_crosses"},
        {name: "Male PC/FSG Crosses Completed", key: "y_crosses", visible: true, format_fn: formatStr, width:".9fr",
            className:"numberCell", order:2, order_direction: "", order_by: "y_crosses"},
    ];
    const REFUGE_CROSSES_COLS = [{name: "Edit", key: "edit", visible: true, format_fn:formatTextWithIcon,
        format_args:['icon-pencil', true, 'Show/Hide Edit details'], width:".3fr"},
        {name: "PC/FSG", key: "group_id",  visible: true, format_fn: formatStr, width:".65fr",
        className:"numberCell", order_direction: "ASC", order:1, order_by: "group_id"},
        {name: "MFG", key: "mfg",  visible: true, format_fn: formatStr, width:".55fr", className:"numberCell",
            order:2, order_direction: "", order_by: "mfg"}].concat(BOTH_CROSSES_COLS);

    const SUPPLEMENTATION_CROSSES_COLS = [{name: "Edit", key: "edit", visible: true, format_fn:formatTextWithIcon,
        format_args:['icon-pencil', true, 'Show/Hide Edit details'], width:".25fr"},
        {name: "Tank", key: "mfg",  visible: true, format_fn: formatStr,
        width:".55fr", className:"numberCell", order:1, order_direction: "DESC", order_by: "mfg"}].concat(BOTH_CROSSES_COLS);

    const REFUGE_CROSSES_HEADER = {
        rows:{"getRowClass": getRowClass},
        cols: REFUGE_CROSSES_COLS
    };
    const SUPPLEMENTATION_CROSSES_HEADER = {
        rows:{"getRowClass": getRowClass},
        cols: SUPPLEMENTATION_CROSSES_COLS
    }
    const [isLoading, setIsLoading] = useState(false);
    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState("");
    const [completedCrossesYear, setCompletedCrossesYear] = useState(new Date().getFullYear());
    const [reloadTable, setReloadTable] = useState(0);
    const [crossTypeDropdownOpen, setCrossTypeDropdownOpen] = useState(false);
    const [viewingRefugeCrosses, setViewingRefugeCrosses] = useState(true);
    const [currentHeaders, setCurrentHeaders] = useState(REFUGE_CROSSES_HEADER);
    const [tableFetchParams, setTableFetchParams] = useState(
        {'year':completedCrossesYear, 'refuge':viewingRefugeCrosses})
    const {_, __, getUsername} = useToken();

    const toggleCrossType = () => setCrossTypeDropdownOpen(prevState => !prevState)

    const handleExportCrossesClick = async e => {
        let fileName = 'supplementation_crosses.csv';
        if (viewingRefugeCrosses){
            fileName = 'refuge_crosses.csv'
        }
        fetchFile("cross_fish/export_crosses", fileName, getUsername(),
            {...tableFetchParams, ...{offset: 0}}, () =>{})
    };

    function changeCrossUse (refuge){
        setViewingRefugeCrosses(refuge);
        const newParams = {'year': completedCrossesYear, 'refuge': refuge};
        setTableFetchParams(newParams);
        setCurrentHeaders(refuge ? REFUGE_CROSSES_HEADER : SUPPLEMENTATION_CROSSES_HEADER);
    }

    function setCompletedCrossesYearWrapper(year)  {
        setCompletedCrossesYear(year);
        const newParams = {'year': year, 'refuge': viewingRefugeCrosses}
        setTableFetchParams(newParams)
    }

    function getRowClass(item) {
        if (item['cross_failed']){
            return "row-line-through";
        }
        return "";
    }

    function updateReloadTable() {
        setReloadTable(reloadTable + 1)
    }

    const getExpandedRow = (item) => {
        return (<ViewCrossesExpanded item={item}
                                     reloadTable={updateReloadTable}
                                     refugeCrosses={viewingRefugeCrosses}/>)
    }

    function getCrossTypeDropdownLabel(){
        if (viewingRefugeCrosses){
            return "Refuge"
        }else{
            return "Supplementation"
        }
    }
    return(
        <div className={classnames('wrapper', 'view-fish', isLoading ? 'disabled' : '')}>
            <Container>
                <Row>
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                </Row>
                <Row>
                    <Col>
                    <Col>
                        <Row>
                            <Col style={{padding: 0, flexBasis: "fit-content", flexGrow: "0"}}>
                                <span>Cross Use:</span>
                            </Col>
                            <Col>
                                <Dropdown label="Refuge" toggle={toggleCrossType} isOpen={crossTypeDropdownOpen}>
                                    <DropdownToggle style={{paddingTop: 0, paddingLeft: 0}}
                                                    aria-expanded={false}
                                                    aria-haspopup={true}
                                                    caret
                                                    color="default"
                                                    data-toggle="dropdown"
                                                    id="crossesTypeMenuLink"
                                                    nav
                                    >
                                        <span id="crossType">{getCrossTypeDropdownLabel()}</span>
                                    </DropdownToggle>
                                    <DropdownMenu aria-labelledby="navbarDropdownMenuLink">
                                        <DropdownItem onClick={() => changeCrossUse(true)}>
                                            Refuge
                                        </DropdownItem>
                                        <DropdownItem onClick={() => changeCrossUse(false)}>
                                            Supplementation
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </Col>
                        </Row>
                        <Row>
                            <Col style={{padding: 0, flexBasis: "fit-content", flexGrow: "0"}}>
                                <span>Cross completion year:</span>
                            </Col>
                            <Col>
                                <CrossYearDropdown yearSelectedCallback={setCompletedCrossesYearWrapper}/>
                            </Col>
                        </Row>
                    </Col>
                    </Col>
                    <Col style={{
                        padding: 0, textAlign: "right", flexGrow: "0", flexBasis: "fit-content",
                        justifyContent: "flex-end"
                    }}>
                        <Button className="btn" color="default" type="button" onClick={handleExportCrossesClick}>
                            Export Crosses
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <AmphiTable tableDataUrl="cross_fish/get_completed_crosses"
                                headerDataStart={currentHeaders}
                                fetchParams={tableFetchParams}
                                reloadData={reloadTable}
                                getExpandedRow={getExpandedRow}
                                filter={ViewCrossesFilter}
                    />
                </Row>
            </Container>
        </div>
    );


}