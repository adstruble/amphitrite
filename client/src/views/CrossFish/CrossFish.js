import {Button, Container, FormGroup, Input, Row} from "reactstrap";
import {Modal} from "reactstrap";
import React, {useEffect, useState} from "react";
import AmphiTable from "../../components/Table/AmphiTable";
import {formatStr, formatDoubleTo3, formatArrayToStr, formatCheckbox} from "../../components/Utils/FormatFunctions";
import classnames from "classnames";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";
import fetchFile from "../../server/fetchFile";
import RadioGroup from "../../components/Basic/RadioGroup";
import AmphiAlert from "../../components/Basic/AmphiAlert";
import {useOutletContext} from "react-router-dom";
import ReactDatetime from "react-datetime";
import moment from "moment";

export default function CrossFish(callback, deps) {
    const {token, setToken, getUsername} = useToken();
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
    const [availableFTags, setAvailableFTags] = useState("");
    const [fTagAlertText, setFTagAlertText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [setSpinning] = useOutletContext();
    const [crossCompletionDate, setCrossCompletionDate] = useState(moment(new Date()).format("DD/MM/YYYY"));

    const handleExportCrossesClick = async e => {
        fetchFile("cross_fish/export_selected_crosses", getUsername(),
            {}, exportSelectionCallback)
    };


    const handleSetAvailableFemalesClick = async e => {
        setSelectFemalesOpen(true);
    };

    const exportSelectionCallback = () => {
        console.info("selected crosses exported")

    }

    const handleUseRefuge = (e, item) =>handleUseCross(e, item, false)
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
        return item['selected_male_fam_cnt'] > 0 || item['supplementation'];
    }

    const cantUseSupplementation = (item) =>{
        return item['refuge'];
    }

    const isCompleted = (item) => {
        return item['completed_x'].length > 0 && item['completed_x'][0] != null
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
          supplementation: item['supplementation']},
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
            {f_tag: selectedFemale, m_tag: selectedMaleVar, f: requestedCross['f']},
            () => {
                setReloadTable(reloadTable => reloadTable + 1)
            }
        );

    }

    const getAvailableFTags = React.useCallback(async () => {
            fetchData("cross_fish/get_available_f_tags", getUsername(),
                {}, (success) => {
                setAvailableFTags(success['f_tags']);
            });
        }, [fetchData]);

    // Set the starting value for userSetFTags on page load.
    React.useEffect(() => {
        getAvailableFTags().then(()=> setUserSetFTags(availableFTags))
    }, []);

    // If the actual available ftags change, update the message of what the available crosses
    // table is for.
    React.useEffect( () => {
        setFTagAlertText("Available female fish for crossing: " +
            (availableFTags.length === 0 ? "None set." : availableFTags) +
        "<br>" +
            "Cross completion date: " + (crossCompletionDate.length === 0 ? "Not set." : crossCompletionDate)
        );
    }, [availableFTags]);

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
        input.value = userSetFTags
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
    // Highlight the tag that was used in the completed cross if there was one.
    const formatArrayToStrTags = (tags, requested_cross, m_f) => {
        tags.sort(function (a, b){return sort_by_completed(a, b, requested_cross['completed' + m_f][0])});
        if (requested_cross['completed' + m_f].length > 0 && requested_cross['completed' + m_f][0] != null){
            return (tags.map((tag, index) => {
                let comma = index < tags.length - 1 ? ", " : ""
                if (tag === requested_cross['completed' + m_f][0]) {
                    return(<span className='text-primary'>{tag}{comma}</span>);
                }
                return(<span className='text-muted'>{tag}{comma}</span>)

            }
         ));
        }else{
            return formatArrayToStr(tags)
        }
    }

    const sort_by_completed = (item_1, item_2, completed_tag) =>{
        if (item_1 === completed_tag){
            return -1;
        }
        return 0
    }

    const CROSSES_HEADER = [
        {name: "Refuge Cross", key: "refuge", visible: true, format_fn:formatCheckbox,
            format_args:[handleUseRefuge, useRefugeSelected, cantUse], width:".7fr"},
        {name: "Suppl. Cross", key: "supplementation", visible: true, format_fn:formatCheckbox,
            format_args:[handleUseSupplementation, useSupplementationSelected, cantUseSupplementation], width:".7fr"},
        {name: "Cross Completed", key: "", visible: true, format_fn:formatCheckbox,
            format_args:[handleCompletedChecked,  isCompleted], width:".7fr"},
        {name: "F", key: "f", visible: true, format_fn: formatDoubleTo3, width:"1fr"},
        {name: "DI", key: "di", visible: true, format_fn: formatDoubleTo3, width:".7fr"},
        {name: "F Fish", key: "f_tags", visible: true, format_fn: formatArrayToStrTags, width:"2fr", format_args: '_x'},
        {name: "F Group ID", key: "x_gid",  visible: true, format_fn: formatStr, width:".9fr"},
        {name: "F Crosses Completed", key: "x_crosses", visible: true, format_fn: formatStr, width:".7fr"},
        {name: "M Fish", key: "m_tags", visible: true, format_fn: formatArrayToStrTags, width:"2.5fr", format_args:'_y'},
        {name: "M Group ID", key: "y_gid",  visible: true, format_fn: formatStr, width:".9fr"},
        {name: "M Crosses Completed", key: "y_crosses", visible: true, format_fn: formatStr, width:".7fr"},
        ];

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
            <Container>
                <Row>
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                </Row>
                <Row>
                    <Button className="btn" color="default" type="button" onClick={handleExportCrossesClick}>
                        Export Selected Crosses
                    </Button>
                </Row>
                <Row>
                    <div>Available female fish for crossing: {availableFTags}
                        <Button className="btn setting" color="default" type="button"
                                onClick={handleSetAvailableFemalesClick}>Set</Button>
                    </div>
                </Row>
                <Row>
                    <div>Cross completion date:</div>
                    <div className="datepicker-container setting">
                        <FormGroup className="form-group setting">
                                <ReactDatetime
                                    className=" amphi-date"
                                    value={crossCompletionDate}
                                    onChange={(date) => setCrossCompletionDate(moment(date).format("MM/DD/YYYY"))}
                                    dateFormat="MM/DD/YY"
                                    timeFormat={false}
                                />
                            </FormGroup>
                    </div>
                </Row>
                <Row>
                    <AmphiTable tableDataUrl="cross_fish/get_possible_crosses"
                                headerDataStart={CROSSES_HEADER}
                                reloadData={reloadTable}
                    />
                </Row>
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
            </Container>

        </div>
    )
}