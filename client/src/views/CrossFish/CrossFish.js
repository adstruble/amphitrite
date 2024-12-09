import {Button, Container, FormGroup, Input, Row, Col} from "reactstrap";
import {Modal} from "reactstrap";
import React, {useState} from "react";
import AmphiTable from "../../components/Table/AmphiTable";
import {
    formatStr,
    formatDoubleTo3,
    formatCheckbox, formatArrayToStrTags
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

export default function CrossFish() {
    const {getUsername} = useToken();
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

    const [isLoading, setIsLoading] = useState(false);
    const [setSpinning] = useOutletContext();
    const [crossCompletionDate, setCrossCompletionDate] = useState(moment(new Date()).format("MM/DD/YYYY"));

    const handleExportCrossesClick = async _ => {
        fetchFile("cross_fish/export_selected_crosses", 'request_crosses.csv', getUsername(),
            {}, () =>{})
    };


    const handleSetAvailableFemalesClick = async _ => {
        setSelectFemalesOpen(true);
    };

    const handleUseRefuge = (e, item) => handleUseCross(e, item, false)
    const handleUseSupplementation = (e, item) =>handleUseCross(e, item, true)
    const handleUseCross = (e, item, supplementation)  => {
        if (e.target.checked){
            fetchData("cross_fish/add_selected_cross", getUsername(),
                {cross_id: item['id'], f: item['f'], supplementation: supplementation}, () => {
                    setReloadTable(reloadTable => reloadTable + 1)})
        }else{
            fetchData("cross_fish/remove_selected_cross", getUsername(),
                {cross_id: item['id']}, () => {
                    setReloadTable(reloadTable => reloadTable + 1)})
        }
    };

    const useRefugeSelected = (item) => {
        return item['refuge']
    }

    const useSupplementationSelected = (item) => {
        return item['supplementation']
    }

    const cantUse = (item) =>{
        return item['selected_male_fam_cnt'] > 0 || item['supplementation'] ||
            (item['completed_x'].length > 0 && item['completed_x'][0] != null);
    }

    const cantUseSupplementation = (item) =>{
        return item['refuge'] || (item['completed_x'].length > 0 && item['completed_x'][0] != null);
    }

    const cantComplete = (item) => {
        return !(item['refuge']) && !(item['supplementation'])
    }

    const isCompleted = (item) => {
        return item['completed_x'].length > 0 && item['completed_x'][0] != null;
    }

    const handleCompletedChecked = (e, item)  => {
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
     cross_completed_date: crossCompletionDate},
                    () => {
                        setReloadTable(reloadTable => reloadTable + 1)},
                    null, null, setAlertLevel, setAlertText
                    );
            }
        }else{
            fetchData("cross_fish/remove_completed_cross", getUsername(),
                {f_tag: item['completed_x'][0], m_tag: item['completed_y'][0]},
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
      cross_completed_date: crossCompletionDate},
            () => {
                setReloadTable(reloadTable => reloadTable + 1)
            }
        );

    }

    const getAvailableFTags = React.useCallback(async () => {
            fetchData("cross_fish/get_available_f_tags", getUsername(),
                {}, (success) => {
                setAvailableFTags(success['f_tags'].length > 0 ? success['f_tags'] : "None");
            });
        }, [fetchData]);

    // Set the starting value for userSetFTags on page load.
    React.useEffect(() => {
        getAvailableFTags().then(()=> setUserSetFTags(availableFTags))
    }, []);


    React.useEffect(() =>{
        if (isLoading){
            setSpinning(true);
        }else{
            setSpinning(false);
        }
    }, [isLoading]);

    const selectFemales = () => {
        setSelectFemalesOpen(false);
        const input = document.getElementById("selectFemalesFormArea");
        const f_tags = input.value.split(",");
        setUserSetFTags(f_tags)
        setIsLoading(true);
        fetchData("cross_fish/set_available_females", getUsername(),
            {f_tags:f_tags},
            () =>void 0,
            (data) => {
            setAvailableCallback(data);
            setIsLoading(false);
        });
    }

    const onSetAvailableFemalesOpened = () => {
        const input = document.getElementById("selectFemalesFormArea");
        input.value = userSetFTags !== "None" ? userSetFTags : "";
    }

    const setAvailableCallback = (data) => {
        if(!data['success']){
            if ('error' in data) {
                setAlertLevel('danger')
                setAlertText(data['error']);
            }else {
                setAlertLevel('warning')
                setAlertText(data['warning']);
            }
        }
        setAvailableFTags(data['data'])
        setReloadTable(reloadTable => reloadTable + 1)
    }

    const onFishSelected = (fish_tag) => {
        if (possibleFishColumn === 'm_tags') {
            setSelectedMale(fish_tag)
        }else{
            setSelectedFemale(fish_tag)
        }
    }

    const closeSelectFish = () => {
        document.getElementById(requestedCross['id'] + 'handleCompletedChecked').checked = false;
        setSelectFishOpen(false);
    }

    const getExpandedRow = (item) => {
        return (<CrossFishExpanded item={item}/>)
    }

    const CROSSES_HEADER = {
        rows:{},
        cols:[{name: "Refuge Cross", key: "refuge", visible: true, format_fn:formatCheckbox,
            format_args:[handleUseRefuge, useRefugeSelected, cantUse], width:".7fr"},
        {name: "Suppl. Cross", key: "supplementation", visible: true, format_fn:formatCheckbox,
            format_args:[handleUseSupplementation, useSupplementationSelected, cantUseSupplementation], width:".7fr"},
        {name: "Cross Completed", key: "", visible: true, format_fn:formatCheckbox,
            format_args:[handleCompletedChecked,  isCompleted, cantComplete], width:".7fr"},
        {name: "F", key: "f", visible: true, format_fn: formatDoubleTo3, width:"1fr"},
        {name: "DI", key: "di", visible: true, format_fn: formatDoubleTo3, width:".7fr"},
        {name: "F Fish", key: "f_tags", visible: true, format_fn: formatArrayToStrTags,
            width:"2fr", format_args: '_x', tooltip: true},
        {name: "F PC/FSG", key: "x_gid",  visible: true, format_fn: formatStr, width:".9fr"},
        {name: "F Crosses Completed", key: "x_crosses", visible: true, format_fn: formatStr, width:".7fr"},
        {name: "M Fish", key: "m_tags", visible: true, format_fn: formatArrayToStrTags, width:"2.5fr",
            format_args:'_y', tooltip: true},
        {name: "M PC/FSG", key: "y_gid",  visible: true, format_fn: formatStr, width:".9fr"},
        {name: "M Crosses Completed", key: "y_crosses", visible: true, format_fn: formatStr, width:".7fr"},
        ]};

    return (
        <div className={classnames('wrapper', 'cross-fish', isLoading ? 'disabled' : '')}>
            <Modal onOpened={onSetAvailableFemalesOpened} isOpen={selectFemalesOpen}  modalClassName="modal-black" id="selectFemales">
                <div className="modal-header justify-content-center">
                    <Button className="btn-close" onClick={() => setSelectFemalesOpen(false)}>
                        <i className="tim-icons icon-simple-remove text-white"/>
                    </Button>
                    <div className="text-muted text-center ml-auto mr-auto">
                        <h3 className="mb-0">Set Available Females</h3>
                        <h5 className="mb-0">Only crosses for available females will be recommended</h5>
                    </div>
                </div>
                <div className="modal-body">
                    <div>
                        <Input className="form-control" id="selectFemalesFormArea" rows="3"/>
                    </div>
                    <span>Provide available female tags as a comma separated list.</span>
                </div>
                <div className="modal-footer">
                    <Button color="default" className="btn" type="button"
                            onClick={() => setSelectFemalesOpen(false)}>Cancel</Button>
                    <Button color="success" type="button" onClick={selectFemales}>Select</Button>
                </div>
            </Modal>
            {/* <Container style={{marginLeft: 0}}>
                <Row>
                    { <Col >
                        <SideNav/>
                    </Col>
                    <Col md="auto">*/}
            <Container>
                <Row>
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                </Row>

                <Row>
                    <Col>
                        <Row>
                            <div>Available female fish for crossing: {availableFTags}
                                <Button className="btn setting" color="default" type="button"
                                        onClick={handleSetAvailableFemalesClick}>Set</Button>
                            </div>
                        </Row>
                        <Row>
                            <Col style={{padding:0, flexBasis:"fit-content", flexGrow:"0"}}>
                                <span>Date cross made:</span>
                            </Col>
                            <Col style={{padding:0, flexGrow:"1", flexBasis:"fit-content"}}>
                                <div className="datepicker-container setting">
                                    <FormGroup className="form-group setting">
                                            <ReactDatetime
                                                className=" amphi-date"
                                                value={crossCompletionDate}
                                                onChange={(date) => {
                                                    if (date instanceof String){
                                                        setAlertLevel('danger');
                                                        setAlertText("'" + date +
                                                            "' is not a valid date. Cross completion date must be a valid date.");
                                                    }else {
                                                        setCrossCompletionDate(moment(date).format("MM/DD/YYYY"));
                                                    }
                                                }}
                                                inputProps={ {readOnly:true} }
                                                dateFormat="MM/DD/YYYY"
                                                timeFormat={false}
                                            />
                                        </FormGroup>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                    <Col style={{padding:0, textAlign:"right", flexGrow:"0", flexBasis:"fit-content"}}>
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
                        <div>
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
            {/*
                    </Col>
                </Row>
            </Container> */}

        </div>
    )
}