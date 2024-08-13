import {Button, Container, Row} from "reactstrap";
import {Modal} from "reactstrap";
import React, {useState} from "react";
import AmphiTable from "../../components/Table/AmphiTable";
import {formatStr, formatDoubleTo3, formatArrayToStr, formatCheckbox} from "../../components/Utils/FormatFunctions";
import classnames from "classnames";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";
import fetchFile from "../../server/fetchFile";
import RadioGroup from "../../components/Basic/RadioGroup";

export default function CrossFish() {
    const {token, setToken, getUsername} = useToken();
    const [reloadTable, setReloadTable] = useState(0);
    const [selectMaleOpen, setSelectMaleOpen] = useState(false);
    const [selectFemalesOpen, setSelectFemalesOpen] = useState(false);
    const [selectedMale, setSelectedMale] = useState("");
    const [requestedCross, setRequestedCross] = useState({'m_tags':[]})
    const [requestedCheckbox, setRequestedCheckbox] = useState();
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
                setRequestedCheckbox(e.target)
            }else {
                fetchData("cross_fish/set_cross_completed", getUsername(),
                    {f_tag: item['f_tag'], m_tag: item['m_tags'][0], f: item['f']}, (success) => updateCheckbox(e.target, success))
            }
        }else{
            fetchData("cross_fish/remove_completed_cross", getUsername(),
                {f_tag: item['f_tag'], }, (success) => updateCheckbox(e.target, !success))
        }
    };

    const selectMale = () => {
        setSelectMaleOpen(false);
        fetchData("cross_fish/set_cross_completed", getUsername(),
            {f_tag: requestedCross['f_tag'], m_tag: selectedMale, f: requestedCross['f']}, (success) => updateCheckbox(requestedCheckbox, success))

    }

    const selectFemales = () => {
        setSelectFemalesOpen(false);
        const input = document.getElementById("selectFemalesFormArea");
        const inputValue = input.value;
        fetchData("cross_fish/set_available_females", getUsername(),
                {f_tags:inputValue}, (success) => setReloadTable(reloadTable + 1))

    }

    const onMaleSelected = (m_tag) => {
        setSelectedMale(m_tag)
    }

    // Highlight the male tag that was used in the completed cross if there was one.
    const formatArrayToStrMaleTags = (m_tags, item) => {
        m_tags.sort(function (a, b){return sort_by_completed(a, b, item['completed'][0])});
        if (item['completed'].length > 0 && item['completed'][0] != null){
            return (m_tags.map((tag, index) => {
                let comma = index < m_tags.length - 1 ? ", " : ""
                if (tag === item['completed'][0]) {
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
            <Container>
                <Row>
                    <Button className="btn" color="default" type="button" onClick={handleExportCrossesClick}>
                        Export Selected Crosses
                    </Button>
                    <Button className="btn" color="default" type="button" onClick={handleSetAvailableFemalesClick}>
                        Set Available Females
                    </Button>
                </Row>
                <Row>
                    <AmphiTable getTableDataUrl="cross_fish/get_best_available"
                                headerDataStart={CROSSES_HEADER}
                                reloadData={reloadTable}
                                includePagination={false}
                    />
                </Row>
                <Modal isOpen={selectMaleOpen} onHide={() => setSelectMaleOpen(false)} modalClassName="modal-black">
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
                <Modal isOpen={selectFemalesOpen} onHide={() => setSelectFemalesOpen(false)} modalClassName="modal-black">
                    <div className="modal-header justify-content-center">
                        <button className="btn-close" onClick={() => setSelectFemalesOpen(false)}>
                            <i className="tim-icons icon-simple-remove text-white"/>
                        </button>
                        <div className="text-muted text-center ml-auto mr-auto">
                            <h3 className="mb-0">Select Available Females</h3>
                        </div>
                    </div>
                    <div className="modal-body">
                        <div>
                            <textarea className="form-control" id="selectFemalesFormArea" rows="3"></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                    <Button color="default" className="btn" type="button"
                                onClick={() => setSelectFemalesOpen(false)}>Cancel</Button>

                        <Button color="success" type="button" onClick={selectFemales}>Select</Button>
                    </div>
                </Modal>
            </Container>
        </div>
    )
}