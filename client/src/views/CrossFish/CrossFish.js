import {Button, Container, Input, Row} from "reactstrap";
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

export default function CrossFish() {
    const {token, setToken, getUsername} = useToken();
    const [reloadTable, setReloadTable] = useState(0);
    const [selectMaleOpen, setSelectMaleOpen] = useState(false);
    const [selectFemalesOpen, setSelectFemalesOpen] = useState(false);
    const [selectedMale, setSelectedMale] = useState("");
    const [requestedCross, setRequestedCross] = useState({'m_tags':[]})
    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState("");
    const [availableFTags, setAvailableFTags] = useState("")

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

    const updateCheckbox = (checkbox, selected) => {
        checkbox.checked = selected;
    };

    const handleUseChecked = (e, item)  => {
        if (e.target.checked){
            fetchData("cross_fish/add_selected_cross", getUsername(),
                {cross_id: item['id'], f: item['f']}, () => void 0)
        }else{
            fetchData("cross_fish/remove_selected_cross", getUsername(),
                {cross_id: item['id']}, () => void 0)
        }
    };

    const isSelected = (item) => {
        return item['selected']
    }

    const isCompleted = (item) => {
        return item['completed'].length > 0 && item['completed'][0] != null
    }

    const handleCompletedChecked = (e, item)  => {
        if (e.target.checked){
            if (item['m_tags'].length > 1){
                setSelectMaleOpen(true);
                setRequestedCross(item);
            }else {
                fetchData("cross_fish/set_cross_completed", getUsername(),
                    {f_tag: item['f_tag'], m_tag: item['m_tags'][0], f: item['f']},
                    () => {
                        setReloadTable(reloadTable => reloadTable + 1)},
                    null, null, setAlertLevel, setAlertText
                    );
            }
        }else{
            fetchData("cross_fish/remove_completed_cross", getUsername(),
                {f_tag: item['f_tag'], m_tag: item['completed'][0]},
                () => setReloadTable(reloadTable => reloadTable + 1),
                null, null, setAlertLevel, setAlertText)
        }
    };

    const selectMale = () => {
        setSelectMaleOpen(false);
        fetchData("cross_fish/set_cross_completed", getUsername(),
            {f_tag: requestedCross['f_tag'], m_tag: selectedMale, f: requestedCross['f']},
            () => {
                setReloadTable(reloadTable => reloadTable + 1)
        }
        );

    }


    const getAvailableFTags = React.useCallback(async () => {
        fetchData("cross_fish/get_available_f_tags", getUsername(),
            {}, (success) => setAvailableFTags(success['f_tags']));
        }, [fetchData]
    );

    React.useEffect(() => {
        getAvailableFTags().then()
    }, []);

    const selectFemales = () => {
        setSelectFemalesOpen(false);
        const input = document.getElementById("selectFemalesFormArea");
        const f_tags = input.value.split(",");
        setAvailableFTags(f_tags)

        fetchData("cross_fish/set_available_females", getUsername(),
            {f_tags:f_tags},
            () =>void 0,
            (data) => setAvailableCallback(data));
    }

    const onSetAvailableFemalesOpened = () => {
        const input = document.getElementById("selectFemalesFormArea");
        input.value = availableFTags
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
            return;
        }
        setReloadTable(reloadTable => reloadTable + 1)
    }

    const onMaleSelected = (m_tag) => {
        setSelectedMale(m_tag)
    }

    // Highlight the male tag that was used in the completed cross if there was one.
    const formatArrayToStrMaleTags = (m_tags, requested_cross) => {
        m_tags.sort(function (a, b){return sort_by_completed(a, b, requested_cross['completed'][0])});
        if (requested_cross['completed'].length > 0 && requested_cross['completed'][0] != null){
            return (m_tags.map((tag, index) => {
                let comma = index < m_tags.length - 1 ? ", " : ""
                if (tag === requested_cross['completed'][0]) {
                    return(<span className='text-primary'>{tag}{comma}</span>);
                }
                return(<span className='text-muted'>{tag}{comma}</span>)

            }
         ));
        }else{
            return formatArrayToStr(m_tags)
        }
    }

    const sort_by_completed = (item_1, item_2, completed_tag) =>{
        if (item_1 === completed_tag){
            return -1;
        }
        return 0
    }

    const CROSSES_HEADER = [
        {name: "Use Cross", key: "selected", visible: true, format_fn:formatCheckbox, format_args:[handleUseChecked, isSelected], width:".7fr"},
        {name: "Cross Completed", key: "completed", visible: true, format_fn:formatCheckbox, format_args:[handleCompletedChecked,  isCompleted], width:".8fr"},
        {name: "F Value", key: "f", visible: true, format_fn: formatDoubleTo3, width:"1fr"},
        {name: "F Fish", key: "f_tag", visible: true, format_fn: formatStr, width:"1fr"},
        {name: "F Group ID", key: "x_gid",  visible: true, format_fn: formatStr, width:"1fr"},
        {name: "F Previous Crosses", key: "x_crosses", visible: true, format_fn: formatStr, width:"1fr"},
        {name: "M Fish", key: "m_tags", visible: true, format_fn: formatArrayToStrMaleTags, width:"2.5fr"},
        {name: "M Group ID", key: "y_gid",  visible: true, format_fn: formatStr, width:"1fr"},
        {name: "M Previous Crosses", key: "y_crosses", visible: true, format_fn: formatStr, width:"1fr"},
        ];

    return (
        <div className={classnames('wrapper', 'cross-fish')}>
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
                    <Button className="btn" color="default" type="button" onClick={handleSetAvailableFemalesClick}>
                        Set Available Females
                    </Button>
                </Row>
                <Row>
                    <AmphiTable tableDataUrl="cross_fish/get_possible_crosses"
                                headerDataStart={CROSSES_HEADER}
                                reloadData={reloadTable}
                                includePagination={false}
                    />
                </Row>
                <Modal isOpen={selectMaleOpen} modalClassName="modal-black" id="selectCrossedMale">
                    <div className="modal-header justify-content-center">
                        <button className="btn-close" onClick={() => setSelectMaleOpen(false)}>
                            <i className="tim-icons icon-simple-remove text-white"/>
                        </button>
                        <div className="text-muted text-center ml-auto mr-auto">
                            <h3 className="mb-0">Select Crossed Male</h3>
                        </div>
                    </div>
                    <div className="modal-body">
                        <div>
                            <RadioGroup items={requestedCross['m_tags']} radioSelectedCallback={onMaleSelected}></RadioGroup>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <Button color="default" className="btn" type="button"
                                onClick={() => setSelectMaleOpen(false)}>Cancel</Button>
                        <Button color="success" type="button" onClick={selectMale}>Select</Button>
                    </div>
                </Modal>
            </Container>
        </div>
    )
}