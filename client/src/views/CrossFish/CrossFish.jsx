import {Button, Container, FormGroup, Input, Row, Col, NavLink, NavItem, Nav, TabContent, TabPane} from "reactstrap";
import {Modal} from "reactstrap";
import React, {useRef, useState} from "react";
import AmphiTable from "../../components/Table/AmphiTable";
import {
    formatStr,
    formatDoubleTo3,
    formatCheckbox, formatArrayToStrTags, formatTextWithIcon
} from "../../components/Utils/FormatFunctions";
import classnames from "classnames";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";
import fetchFile from "../../server/fetchFile";
import RadioGroup from "../../components/Basic/RadioGroup";
import AmphiAlert from "../../components/Basic/AmphiAlert";
import {useOutletContext} from "react-router-dom";
import ReactDatetime from "react-datetime";
import moment from "moment";
import CrossFishExpanded from "./CrossFishExpanded";
import {CrossFishFilter} from "./CrossFishFilter";

export default function CrossFish() {
    const {getUsername} = useToken();
    const getUsernameRef = useRef(getUsername);
    getUsernameRef.current = getUsername;
    const [reloadTable, setReloadTable] = useState(0);
    const [selectFishOpen, setSelectFishOpen] = useState(false);
    const [possibleFishColumn, setPossibleFishColumn] = useState("");
    const [selectFemalesOpen, setSelectFemalesOpen] = useState(false);
    const [selectedMale, setSelectedMale] = useState("");
    const [selectedFemale, setSelectedFemale] = useState("");
    const [requestedCross, setRequestedCross] = useState({'m_tags':[]});
    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState("");
    const [userSetFTags, setUserSetFTags] = useState("");
    const [availableFTags, setAvailableFTags] = useState("None");
    const [uncrossedFTags, setUncrossedFTags] = useState("")

    const [isLoading, setIsLoading] = useState(false);
    const [setSpinning] = useOutletContext();
    const [crossCompletionDate, setCrossCompletionDate] = useState(moment(new Date()).format("MM/DD/YYYY"));

    const [availableFemalesFile, setAvailableFemalesFile] = useState(null);
    const [availableFemalesFileName, setAvailableFemalesFileName] = useState("");
    const [setFemaleTab, setSetFemaleTab] = useState(1);

    const handleExportCrossesClick = async _ => {
        fetchFile("cross_fish/export_selected_crosses", 'request_crosses.csv', getUsername(),
            {}, () =>{},
            (msg)=>{setAlertText(msg); setAlertLevel('danger');})
    };


    const handleSetAvailableFemalesClick = async _ => {
        setSelectFemalesOpen(true);
    };

    function handleUseRefuge(e, item, getName){
        if(getName){
            return "handleUseRefuge";
        }
        handleUseCross(e, item, false)
    }

    function handleUseSupplementation(e, item, getName) {
        if (getName) {
            return "handleUseSupplementation";
        }
        handleUseCross(e, item, true);
    }

    const handleUseCross = (e, item, supplementation)  => {
        if (e.target.checked){
            fetchData("cross_fish/add_selected_cross", getUsername(),
                {cross_id: item['id'], f: item['f'], supplementation: supplementation}, () => {
                    setReloadTable(reloadTable => reloadTable + 1)},
                (data) =>{setUncrossedFTags(data['data']['uncrossed_tags'])},
                null, setAlertLevel, setAlertText)
        }else{
            fetchData("cross_fish/remove_selected_cross", getUsername(),
                {cross_id: item['id']}, () => {
                    setReloadTable(reloadTable => reloadTable + 1)},
                (data)=>{setUncrossedFTags(data['data']['uncrossed_tags'])},
                null, setAlertLevel, setAlertText)
        }
    };

    const useRefugeSelected = (item) => {
        return item['refuge'] || (item['completed_x'] && item['completed_x'].endsWith("_ref"))
    }

    const useSupplementationSelected = (item) => {
        return item['supplementation'] || (item['completed_x'] && item['completed_x'].endsWith("_sup"))
    }

    const cantUse = (item) =>{
        // If item is currently selected as refuge, should always be enabled if it's not completed
        if (item['refuge'] && item['completed_x'] === null){
            return false;
        }
        return item['selected_male_fam_cnt'] > 0 || item['supplementation'] ||
            (item['completed_x'] !== null);
    }

    const cantUseSupplementation = (item) =>{
        // If item is selected as refuge, should always be enabled if it's not completed
        if (item['supplementation'] && item['completed_x'] === null){
            return false;
        }
        // Can't use for a supplementation cross if it has been selected for refuge or the family has been selected
        return item['refuge'] || (item['completed_x'] !== null || item['selected_male_fam_cnt'] > 0);
    }

    const cantComplete = (item) => {
        // If the item has been completed, should always be able to uncomplete
        if (item['completed_x'] != null){
            if(item['f_tags'][0] !== item['completed_x'].slice(0,-4)) {
                return true;
            }
            return false;
        }

        // If all of the fish have been previously crossed for supplementation and this is a requested supplementation
        // cross, don't allow completion.
        if (item['supplementation']){
            let m_tags = item['m_tags'];
            if (m_tags.length === 0 || (m_tags.length === 1 && m_tags[0] === null)){
                return true;
            }
        }

        return !(item['refuge']) && !(item['supplementation'])
    }

    const isCompleted = (item) => {
        return item['completed_x']!= null;
    }

    function handleCompletedChecked(e, item, getName) {
        if (getName){
            return "handleCompletedChecked";
        }
        setSelectedFemale("");
        setSelectedMale("");
        if (e.target.checked){
            if (item['f_tags'].length > 1){
                setPossibleFishColumn("f_tags")
                setSelectFishOpen(true);
                setRequestedCross(item);
            }else if (item['m_tags'].length > 1){
                setPossibleFishColumn("m_tags")
                setSelectFishOpen(true);
                setRequestedCross(item);
                setSelectedFemale(item['f_tags'][0])
            }else {
                fetchData("cross_fish/set_cross_completed", getUsername(),{
                    f_tag: item['f_tags'][0],
                    m_tag: item['m_tags'][0],
                        f: item['f'],
          supplementation: item['supplementation'],
     cross_completed_date: crossCompletionDate,
                        requested_cross: item['id']},
                    () => {
                        setReloadTable(reloadTable => reloadTable + 1)},
                    null, null, setAlertLevel, setAlertText
                    );
            }
        }else{
            fetchData("cross_fish/remove_completed_cross", getUsername(),
                {f_tag: item['completed_x'].slice(0, -4), m_tag: item['completed_y'].slice(0, -4)},
                () => setReloadTable(reloadTable => reloadTable + 1),
                null, null, setAlertLevel, setAlertText)
        }
    };

    const selectFish = () => {
        setSelectFishOpen(false);
        let selectedMaleVar = requestedCross['m_tags'][0];
        if (possibleFishColumn === 'f_tags') {
            if (requestedCross['m_tags'].length > 1) {
                setPossibleFishColumn("m_tags")
                setSelectFishOpen(true);
                return;
            }
        }else{
            selectedMaleVar = selectedMale;
        }


        fetchData("cross_fish/set_cross_completed", getUsername(),
            {f_tag: selectedFemale,
                     m_tag: selectedMaleVar,
                         f: requestedCross['f'],
           supplementation: requestedCross['supplementation'],
                requested_cross: requestedCross['id'],
      cross_completed_date: crossCompletionDate},
            () => {
                setReloadTable(reloadTable => reloadTable + 1)
            }, null, null, setAlertLevel, setAlertText
        );

    }

    /*const getAvailableFTags = React.useCallback(async (callback) => {
            fetchData("cross_fish/get_available_f_tags", getUsername(),
                {}, (success) => {
                setAvailableFTags(success['f_tags'].length > 0 ? success['f_tags'] : "None");
                callback(availableFTags);
            });
        }, []);*/

    // Set the starting value for userSetFTags and availableFTags on page load.
    React.useEffect(() => {
        fetchData("cross_fish/get_available_f_tags", getUsernameRef.current(),
            {}, (success) => {
                let availableFemales = success['f_tags'].length > 0 ? success['f_tags'] : "None"
                setAvailableFTags(availableFemales);
                setUserSetFTags(availableFemales.replaceAll("(","").replaceAll(")",""));
                setUncrossedFTags(success['uncrossed_tags']);
            }, null, null, setAlertLevel, setAlertText);
    }, []);


    React.useEffect(() =>{
        if (isLoading){
            setSpinning(true);
        }else{
            setSpinning(false);
        }
    }, [isLoading, setSpinning]);

    const selectFemales = () => {
        // Tab 1 is file upload
        if (setFemaleTab === 1){
            if (!availableFemalesFile) {
                return;
            }
            setSelectFemalesOpen(false);
            const formData = new FormData();
            formData.append('file', availableFemalesFile);
            setIsLoading(true);
            fetchData("cross_fish/set_available_females_from_file", getUsername(),
                null,
                () => void 0,
                (data) => {
                    setAvailableCallback(data);
                    setIsLoading(false);
                    setUserSetFTags(data['data'])
                },
                null, setAlertLevel, setAlertText, null, formData);
        }
        // Tab 2 is comma separated list in text area
        if (setFemaleTab === 2) {
            setSelectFemalesOpen(false);
            const input = document.getElementById("selectFemalesFormArea");
            const f_tags = input.value.split(",");
            setUserSetFTags(f_tags)
            setIsLoading(true);
            fetchData("cross_fish/set_available_females", getUsername(),
                {f_tags: f_tags},
                () => void 0,
                (data) => {
                    setAvailableCallback(data);
                    setIsLoading(false);
                },
                null, setAlertLevel, setAlertText);
        }
    }

    const onSetAvailableFemalesOpened = () => {
        const input = document.getElementById("selectFemalesFormArea");
        input.value = userSetFTags !== "None" ? userSetFTags : (availableFTags === 'None' ? '' : availableFTags);
    }

    const setAvailableCallback = (data) => {
        if(!data['success']){
            if ('error' in data) {
                setAlertLevel('danger')
                setAlertText(data['error']);
                return;
            }else {
                setAlertLevel('warning')
                setAlertText(data['warning']);
            }
        }
        setAvailableFTags(data['data']['f_tags'])
        setUncrossedFTags(data['data']['uncrossed_tags'])
        setReloadTable(reloadTable => reloadTable + 1)
    }

    const onFishSelected = (fish_tag) => {
        if (possibleFishColumn === 'm_tags') {
            setSelectedMale(fish_tag)
        }else{
            setSelectedFemale(fish_tag)
        }
    }

    function handleFileChange(e){
        if (e.target.files) {
            if (e.target.value.length > 0) {
                setAvailableFemalesFile(e.target.files[0]);
                setAvailableFemalesFileName(e.target.value.split('\\').pop());
            }
        }
    }

    const closeSelectFish = () => {
        document.getElementById(requestedCross['id'] + handleCompletedChecked(null, null, true)).checked = false;
        setSelectFishOpen(false);
    }

    const getExpandedRow = (item) => {
        return (<CrossFishExpanded item={item}/>)
    }

    const CROSSES_HEADER = {
        rows:{},
        cols:[{name: "Refuge Cross", key: "refuge", visible: true, format_fn:formatCheckbox,
            format_args:[handleUseRefuge, useRefugeSelected, cantUse], width:".69fr",
            order:1, order_direction: "DESC", order_by: "ref_cross"},
        {name: "Suppl. Cross", key: "supplementation", visible: true, format_fn:formatCheckbox,
            format_args:[handleUseSupplementation, useSupplementationSelected, cantUseSupplementation], width:".66fr",
        order:2, order_direction: "DESC", order_by:"sup_cross"},
        {name: "Cross Completed", key: "", visible: true, format_fn:formatCheckbox,
            format_args:[handleCompletedChecked,  isCompleted, cantComplete], width:".65fr"},
        {name: "F", key: "f", visible: true, format_fn: formatDoubleTo3, width:".8fr", className:"numberCell",
            order:5, order_direction: "ASC", order_by: "f"},
        {name: "DI", key: "di", visible: true, format_fn: formatDoubleTo3, width:".7fr", className:"numberCell"},
        {name: "F Fish", key: "f_tags", visible: true, format_fn: formatArrayToStrTags,
            width:"1.2fr", format_args: '_x', tooltip: true},
        {name: "F PC/FSG", key: "x_gid",  visible: true, format_fn: formatTextWithIcon,
            format_args:['icon-hide', true, 'Show/Hide Details'], width:".9fr"},
        {name: "F Ref Crosses", key: "x_crosses", visible: true, format_fn: formatStr, width:".77fr", className:"numberCell",
            header_tooltip: "Count of female family refuge crosses completed and requested",
            order:4, order_direction: "ASC", order_by: "f_ref_cross_count"},
        {name: "F Sup Crosses", key: "sup_x_crosses", visible: true, format_fn: formatStr, width:".77fr", className:"numberCell",
            header_tooltip:"Count of female family supplementation crosses completed and requested",
            order:null, order_direction: null, order_by: "f_sup_cross_count"},
        {name: "M Fish", key: "m_tags", visible: true, format_fn: formatArrayToStrTags, width:"2.3fr",
            format_args:'_y', tooltip: true},
        {name: "M PC/FSG", key: "y_gid",  visible: true, format_fn: formatTextWithIcon,
            format_args:['icon-hide', true, 'Show/Hide Details'], width:".9fr"},
        {name: "M Ref Crosses", key: "y_crosses", visible: true, format_fn: formatStr, width:".77fr", className:"numberCell",
            header_tooltip:"Count of male family refuge crosses completed and requested",
            order:3, order_direction: "ASC", order_by: "m_ref_cross_count"},
        {name: "M Sup Crosses", key: "sup_y_crosses", visible: true, format_fn: formatStr, width:".87fr", className:"numberCell",
            header_tooltip:"Count of male family supplementation crosses completed and requested",
            order:null, order_direction: null, order_by: "m_sup_cross_count"}
        ]};

    return (
        <div className={classnames('wrapper', 'cross-fish', isLoading ? 'disabled' : '')}>
            <Modal onOpened={onSetAvailableFemalesOpened} isOpen={selectFemalesOpen}  modalClassName="modal-black" id="selectFemales">
                <div className="modal-header justify-content-center">
                    <button className="btn-close" onClick={() => setSelectFemalesOpen(false)}>
                        <i className="tim-icons icon-simple-remove text-white"/>
                    </button>
                    <div className="text-muted text-center ml-auto mr-auto">
                        <h3 className="mb-0">Set Available Fish</h3>
                        <h5 className="mb-0">Only crosses for available fish will be recommended</h5>
                    </div>
                </div>
                <div className="modal-body">
                    <Nav className="nav-tabs-info" role="tablist" tabs>
                        <NavItem>
                            <NavLink
                                className={classnames({
                                    active: setFemaleTab === 1
                                })}
                                onClick={(_) => setSetFemaleTab(1)}
                            >
                                Upload File
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({
                                    active: setFemaleTab === 2
                                })}
                                onClick={(_) => setSetFemaleTab(2)}
                            >
                                Enter List
                            </NavLink>
                        </NavItem>
                    </Nav>
                    <TabContent className="tab-space" activeTab={"tab" + setFemaleTab}>
                        <TabPane tabId="tab1">
                            <Input className="" type="file" name="file" id="file_input" onChange={handleFileChange}/>
                            <label htmlFor="file_input">Choose File</label>
                            <span>File should specify one fish tag per line</span>
                            <div style={{minHeight:"26.6px"}}>{availableFemalesFileName}</div>
                        </TabPane>
                        <TabPane tabId="tab2">
                            <div>
                                <span>Provide available fish tags as a comma separated list</span>
                            </div>
                            <div>
                                <Input type="textarea" className="form-control" id="selectFemalesFormArea" rows="3"/>
                            </div>
                        </TabPane>
                    </TabContent>
                </div>
                <div className="modal-footer">
                    <Button color="default" className="btn" type="button"
                            onClick={() => setSelectFemalesOpen(false)}>Cancel</Button>
                    <Button color="success" type="button" onClick={selectFemales}>Select</Button>
                </div>
            </Modal>
            <Container>
                <Row>
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                </Row>

                <Row>
                    <Col className="input-area">
                        <Row>
                            <Col>
                                <span>Available female fish for crossing:</span>
                            </Col>
                            <Col>
                                <span style={{marginRight:"20px"}}>{availableFTags}</span>
                                <Button  className="btn setting" color="default" type="button"
                                        onClick={handleSetAvailableFemalesClick}>Set Available Fish</Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span className={uncrossedFTags.length > 0 ? 'text-danger' : 'text-success'}>Females with 0 or 1 selected males:</span>
                            </Col>
                            <Col>
                            <span style={{marginRight:"20px"}}>{uncrossedFTags.length === 0 ? 'None' : uncrossedFTags}</span>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
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
                    </Col>
                    <Col style={{padding: 0, textAlign: "right", flexGrow: "0", flexBasis: "fit-content"}}>
                        <Button className="btn" color="default" type="button" onClick={handleExportCrossesClick}>
                            Export Selected Crosses
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <AmphiTable tableDataUrl="cross_fish/get_possible_crosses"
                                headerDataStart={CROSSES_HEADER}
                                reloadData={reloadTable}
                                getExpandedRow={getExpandedRow}
                                filter={CrossFishFilter}
                    />
                </Row>
            </Container>
            <Modal isOpen={selectFishOpen} modalClassName="modal-black" id="selectCrossedMale">
                <div className="modal-header justify-content-center">
                    <button className="btn-close" onClick={() => closeSelectFish()}>
                        <i className="tim-icons icon-simple-remove text-white"/>
                    </button>
                    <div className="text-muted text-center ml-auto mr-auto">
                    <h3 className="mb-0">Select Crossed {(possibleFishColumn === 'm_tags') ? 'Male' : 'Female'}</h3>
                    </div>
                </div>
                <div className="modal-body">
                    <div style={{paddingLeft:"15px"}}>
                        <RadioGroup items={requestedCross[possibleFishColumn]} radioSelectedCallback={onFishSelected}
                        selectedItem={(possibleFishColumn === 'm_tags') ? selectedMale : selectedFemale}></RadioGroup>
                    </div>
                </div>
                <div className="modal-footer">
                    <Button color="default" className="btn" type="button"
                            onClick={() => closeSelectFish()}>Cancel</Button>
                    <Button disabled={(possibleFishColumn === "m_tags" && selectedMale === "") ||
                        (possibleFishColumn === "f_tags" && selectedFemale === "")} color="success" type="button"
                            onClick={selectFish}>Select</Button>
                </div>
            </Modal>
        </div>
    )
}