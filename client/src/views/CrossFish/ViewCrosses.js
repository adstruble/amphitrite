import classnames from "classnames";
import {
    Button,
    Col,
    Container, Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle, FormGroup,
    Row, UncontrolledTooltip
} from "reactstrap";
import AmphiAlert from "../../components/Basic/AmphiAlert";
import React,{useState} from "react";
import AmphiTable from "../../components/Table/AmphiTable";
import {
    formatDate,
    formatDoubleTo3,
    formatStr, formatTextWithIcon
} from "../../components/Utils/FormatFunctions";
import ViewCrossesExpanded from "./ViewCrossesExpanded";
import fetchFile from "../../server/fetchFile";
import useToken from "../../components/App/useToken";
import {CrossYearDropdown} from "../../components/Basic/CrossYearDropdown";
import {ViewCrossesFilter} from "./ViewCrossesFilter";
import FishDataUpload from "../../components/Upload/FishDataUpload";
import ReactDatetime from "react-datetime";
import moment from "moment/moment";
import {useOutletContext} from "react-router-dom";


export default function ViewCrosses(){
    const BOTH_CROSSES_COLS =
        [{name: "Female PC/FSG", key: "x_gid",  visible: true, format_fn: formatStr, width:".8fr", className:"numberCell",
            order:null, order_direction:null, order_by: "xf.group_id"},
        {name: "Female Fish", key: "f_tag", visible: true, format_fn: formatStr, width:".8fr", format_args: '_x',
            order:null, order_direction:null, order_by: "f_tag"},
        {name: "Male PC/FSG", key: "y_gid",  visible: true, format_fn: formatStr, width:".8fr", className:"numberCell",
            order:null, order_direction:null, order_by: "yf.group_id"},
        {name: "Male Fish", key: "m_tag", visible: true, format_fn: formatStr, width:".8fr", format_args:'_y',
            order:null, order_direction:null, order_by: "m_tag"},
        {name: "Cross Date", key: "cross_date", visible: true, format_fn: formatDate, width: ".9fr",
            order:1, order_direction:"DESC", order_by: "cross_date"},
        {name: "F", key: "f", visible: true, format_fn: formatDoubleTo3, width:".9fr", className:"numberCell",
            order:null, order_direction:null, order_by: "f"},
        {name: "DI", key: "di", visible: true, format_fn: formatDoubleTo3, width:".9fr", className:"numberCell",
            order:null, order_direction:null, order_by: "di"},
        {name: "Female PC/FSG Crosses Completed", key: "x_crosses", visible: true, format_fn: formatStr, width:".9fr",
            className:"numberCell", order:null, order_direction: null, order_by: "x_crosses"},
        {name: "Male PC/FSG Crosses Completed", key: "y_crosses", visible: true, format_fn: formatStr, width:".9fr",
            className:"numberCell", order:null, order_direction: null, order_by: "y_crosses"},
    ];
    const REFUGE_CROSSES_COLS = [{name: "Edit", key: "edit", visible: true, format_fn:formatTextWithIcon,
        format_args:['icon-pencil', true, 'Show/Hide Edit details'], width:".28fr"},
        {name: "PC/FSG", key: "group_id",  visible: true, format_fn: formatStr, width:".65fr",
        className:"numberCell", order_direction: null, order:null, order_by: "completed_cross.group_id"},
        {name: "MFG", key: "mfg",  visible: true, format_fn: formatStr, width:".55fr", className:"numberCell",
            order:null, order_direction:null, order_by: "mfg"}].concat(BOTH_CROSSES_COLS);

    const SUPPLEMENTATION_CROSSES_COLS = [{name: "Edit", key: "edit", visible: true, format_fn:formatTextWithIcon,
        format_args:['icon-pencil', true, 'Show/Hide Edit details'], width:".27fr"},
        {name: "Tank", key: "mfg",  visible: true, format_fn: formatStr,
        width:".55fr", className:"numberCell", order: null, order_direction: null, order_by: "mfg"}].concat(BOTH_CROSSES_COLS);

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
    const [crossCompletionDate, setCrossCompletionDate] = useState(moment(new Date()).format("MM/DD/YYYY"));
    const [setSpinning] = useOutletContext();


    const toggleCrossType = () => setCrossTypeDropdownOpen(prevState => !prevState)

    React.useEffect(() =>{
        if (isLoading){
            setSpinning(true);
        }else{
            setSpinning(false);
        }
    }, [isLoading]);
    
    const handleExportCrossesClick = async e => {
        let fileName = 'supplementation_crosses.csv';
        if (viewingRefugeCrosses){
            fileName = 'refuge_crosses.csv'
        }
        fetchFile("cross_fish/export_crosses", fileName, getUsername(),
            {...tableFetchParams, ...{offset: 0}}, () =>{},
            (msg)=>{setAlertText(msg); setAlertLevel('danger')})
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

    const UserOptions = <Row style={{paddingBottom:10}}>
            <Col style={{justifyContent:"right",paddingRight:0, maxWidth:"fit-content"}}>
                <span>Date cross made:</span>
            </Col>
            <Col>
                <div className="setting">
                    <FormGroup className="form-group setting">
                        <ReactDatetime
                            className=" amphi-date"
                            value={crossCompletionDate}
                            onChange={(date) => {
                                if (date instanceof String) {
                                    setAlertLevel('danger');
                                    setAlertText("'" + date +
                                        "' is not a valid date. Cross completion date must be a valid date.");
                                } else {
                                    setCrossCompletionDate(moment(date).format("MM/DD/YYYY"));
                                }
                            }}
                            inputProps={{readOnly: true}}
                            dateFormat="MM/DD/YYYY"
                            timeFormat={false}
                        />
                    </FormGroup>
                </div>
            </Col>
        </Row>

    const uploadBtnText = "Upload Completed Crosses";
    return (
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
                                    <span>Cross Type:</span>
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
                        <FishDataUpload dataUploadUrl="cross_fish/upload_completed_crosses"
                                        uploadCallback={()=>{setReloadTable(reloadTable + 1)}}
                                        formModalTitle="Upload Completed Refuge Crosses"
                                        uploadButtonText={uploadBtnText}
                                        setIsLoading={setIsLoading}
                                        setAlertText={setAlertText}
                                        setAlertLevel={setAlertLevel}
                                        /*UserOptions={UserOptions}
                                        uploadParams={{'cross_date': crossCompletionDate}}*/
                        />
                        <UncontrolledTooltip target={uploadBtnText.replace(/ /g,'')}
                            placement={"top-start"}>Upload completed crosses file (refuge only)</UncontrolledTooltip>
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