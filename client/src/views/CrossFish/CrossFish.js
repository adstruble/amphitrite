import {Button, Container, Row} from "reactstrap";

import React, {useState} from "react";
import AmphiTable from "../../components/Table/AmphiTable";
import {formatStr, formatDoubleTo3, formatArrayToStr, formatCheckbox} from "../../components/Utils/FormatFunctions";
import classnames from "classnames";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";
import fetchFile from "../../server/fetchFile";

export default function CrossFish() {
    const {token, setToken, getUsername} = useToken();
    const [reloadTable, setReloadTable] = useState(0);

    const handleSelectCrossesClick = async e => {
        fetchFile("cross_fish/export_selected_crosses", getUsername(),
            {}, exportSelectionCallback)
    };

    const exportSelectionCallback = () => {
        console.info("selected crosses exported")

    }

    const selectionSavedCallback = (responseData, params) => {
        console.info("Selection saved return")
    };

    const handleUseChecked = (e, item)  => {
        if (e.target.checked){
            fetchData("cross_fish/add_selected_cross", getUsername(),
                {cross_id: item['id'], f: item['f']}, selectionSavedCallback)
        }else{
            fetchData("cross_fish/remove_selected_cross", getUsername(),
                {cross_id: item['id']}, selectionSavedCallback)
        }
    };


    const handleCompletedChecked = (e, item)  => {
        if (e.target.checked){
            fetchData("cross_fish/add_completed_cross", getUsername(),
                {cross_id: item['id'], f: item['f']}, selectionSavedCallback)
        }else{
            fetchData("cross_fish/remove_completed_cross", getUsername(),
                {cross_id: item['id']}, selectionSavedCallback)
        }
    };


    const CROSSES_HEADER = [
        {name: "Use Cross", key: "selected", visible: true, format_fn:formatCheckbox, format_args:[handleUseChecked], width:".7fr"},
        {name: "Cross Completed", key: "completed", visible: true, format_fn:formatCheckbox, format_args:[handleCompletedChecked], width:".7fr"},
        {name: "F Value", key: "f", visible: true, format_fn: formatDoubleTo3, width:"1fr"},
        {name: "F Fish", key: "x_tag", visible: true, format_fn: formatStr, width:"1fr"},
        {name: "F Group ID", key: "x_gid",  visible: true, format_fn: formatStr, width:"1fr"},
        {name: "F Previous Crosses", key: "x_crosses", visible: true, format_fn: formatStr, width:"1fr"},
        {name: "M Fish", key: "y_tags", visible: true, format_fn: formatArrayToStr, width:"2.5fr"},
        {name: "M Group ID", key: "y_gid",  visible: true, format_fn: formatStr, width:"1fr"},
        {name: "M Previous Crosses", key: "y_crosses", visible: true, format_fn: formatStr, width:"1fr"},
        ];

    return (
        <div className={classnames('wrapper', 'cross-fish')}>
            <Container>
                <Row>
                    <Button className="btn" color="default" type="button" onClick={handleSelectCrossesClick}>
                        Export Selected Crosses
                    </Button>
                </Row>
                <Row>
                    <AmphiTable getTableDataUrl="cross_fish/get_best_available"
                                headerDataStart={CROSSES_HEADER}
                                reloadData={reloadTable}
                                includePagination={false}
                    />
                </Row>
            </Container>
        </div>
    )
}