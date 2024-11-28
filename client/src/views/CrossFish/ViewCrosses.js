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
import {range} from "../../components/Utils/General";
import AmphiTable, {getExpandedDefault} from "../../components/Table/AmphiTable";
import {
    formatDate,
    formatDoubleTo3,
    formatStr
} from "../../components/Utils/FormatFunctions";
import ViewCrossesExpanded from "./ViewCrossesExpanded";

export default function ViewCrosses(){
    const BOTH_CROSSES_COLS =
        [{name: "Female Group ID", key: "x_gid",  visible: true, format_fn: formatStr, width:".8fr", className:"numberCell",
            order:2, order_direction: "", order_by: "xf.group_id"},
        {name: "Female Fish", key: "f_tag", visible: true, format_fn: formatStr, width:".8fr", format_args: '_x',
            order:2, order_direction: "", order_by: "f_tag"},
        {name: "Male Group ID", key: "y_gid",  visible: true, format_fn: formatStr, width:".8fr", className:"numberCell",
            order:2, order_direction: "", order_by: "yf.group_id"},
        {name: "Male Fish", key: "m_tag", visible: true, format_fn: formatStr, width:".8fr", format_args:'_y',
            order:2, order_direction: "", order_by: "m_tag"},
        {name: "Cross Date", key: "cross_date", visible: true, format_fn: formatDate, width: ".9fr",
            order:2, order_direction: "", order_by: "cross_date"},
        {name: "F", key: "f", visible: true, format_fn: formatDoubleTo3, width:".9fr", className:"numberCell",
            order:2, order_direction: "", order_by: "f"},
        {name: "DI", key: "di", visible: true, format_fn: formatDoubleTo3, width:".9fr", className:"numberCell",
            order:2, order_direction: "", order_by: "di"},
        {name: "Female Group Crosses Completed", key: "x_crosses", visible: true, format_fn: formatStr, width:".9fr",
            className:"numberCell", order:2, order_direction: "", order_by: "x_crosses"},
        {name: "Male Group Crosses Completed", key: "y_crosses", visible: true, format_fn: formatStr, width:".9fr",
            className:"numberCell", order:2, order_direction: "", order_by: "y_crosses"},
    ];
    const REFUGE_CROSSES_COLS = [{name: "Group ID", key: "group_id",  visible: true, format_fn: formatStr, width:".65fr",
        className:"numberCell", order_direction: "ASC", order:1, order_by: "group_id"},
        {name: "MFG", key: "mfg",  visible: true, format_fn: formatStr, width:".55fr", className:"numberCell",
            order:2, order_direction: "", order_by: "mfg"},].concat(BOTH_CROSSES_COLS);

    const REFUGE_CROSSES_HEADER = {
        rows:{"getRowClass": getRowClass},
        cols: REFUGE_CROSSES_COLS
    };
    const SUPPLEMENTATION_CROSSES_HEADER = {
        rows:{"getRowClass": getRowClass},
        cols: BOTH_CROSSES_COLS
    }
    const [isLoading, setIsLoading] = useState(false);
    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState("");
    const currentYear = new Date().getFullYear();
    const [completedCrossesYear, setCompletedCrossesYear] = useState(currentYear);
    const years = range(currentYear, 2007);
    const [reloadTable, setReloadTable] = useState(0);
    const [crossYearDropdownOpen, setCrossYearDropdownOpen] = useState(false);
    const [crossTypeDropdownOpen, setCrossTypeDropdownOpen] = useState(false);
    const [viewingRefugeCrosses, setViewingRefugeCrosses] = useState(true);
    const [currentHeaders, setCurrentHeaders] = useState(REFUGE_CROSSES_HEADER);
    const [tableFetchParams, setTableFetchParams] = useState(
        {'year':completedCrossesYear, 'refuge':viewingRefugeCrosses})

    const toggle = () => setCrossYearDropdownOpen((prevState) => !prevState);
    const toggleCrossType = () => setCrossTypeDropdownOpen(prevState => !prevState)

    function handleExportCrossesClick() {

    }

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
                                     reloadTable={updateReloadTable}/>)
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
                        <Row>
                            <Col style={{padding:0, flexBasis:"fit-content", flexGrow:"0"}}>
                                <span>Cross Use:</span>
                            </Col>
                            <Col>
                                <Dropdown label="Refuge" toggle={toggleCrossType} isOpen={crossTypeDropdownOpen}>
                                    <DropdownToggle style={{paddingTop:0, paddingLeft:0}}
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
                            <Col style={{padding:0, flexBasis:"fit-content", flexGrow:"0"}}>
                                <span>Cross completion year:</span>
                            </Col>
                            <Col>
                                <Dropdown label={completedCrossesYear} toggle={toggle} isOpen={crossYearDropdownOpen}>
                                    <DropdownToggle style={{paddingTop:0, paddingLeft:0}}
                                        aria-expanded={false}
                                        aria-haspopup={true}
                                        caret
                                        color="default"
                                        data-toggle="dropdown"
                                        id="crossesDropdownMenuLink"
                                        nav
                                    >
                                        <span id="completedCrossesYear">{completedCrossesYear}</span>
                                    </DropdownToggle>
                                    <DropdownMenu aria-labelledby="navbarDropdownMenuLink">
                                        {years.map((year) => {
                                            return(<DropdownItem onClick={() => setCompletedCrossesYearWrapper(year)}>
                                                {year}
                                            </DropdownItem>)
                                        })}
                                    </DropdownMenu>
                                </Dropdown>
                            </Col>
                        </Row>
                    </Col>
                    <Col style={{padding:0, textAlign:"right", flexGrow:"0", flexBasis:"fit-content",
                        justifyContent:"flex-end"}}>
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
                                getExpandedRow={viewingRefugeCrosses ? getExpandedRow : getExpandedDefault}
                    />
                </Row>
            </Container>
        </div>
    );


}