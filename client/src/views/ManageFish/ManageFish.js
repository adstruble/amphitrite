import {Alert, Button, Container, Row} from "reactstrap";

import FishDataUpload from "../../components/Upload/FishDataUpload";
import React, {useState} from "react";
import {useOutletContext} from "react-router-dom";
import AmphiTable from "../../components/Table/AmphiTable";
import ManageRowExpanded from "./ManageRowExpanded";
import {formatStr, formatDate, formatDoubleTo3} from "../../components/Utils/FormatFunctions";

export default function ManageFish() {
    const [reloadTable, setReloadTable] = useState(0);

    const FISH_HEADER = [
        {name: "Family ID", key: "group_id", order_by: "group_id", visible: true, order_direction: "ASC", order: 1,
            format_fn: formatStr},
        {name: "Parent Cross Date", key: "cross_date", order_by: "cross_date", visible: true, order_direction: "", order: 2,
            format_fn: formatDate},
        {name: "F", key: "f", order_by: "f", visible: true, order_direction: "", order: 2,
            format_fn: formatDoubleTo3},
        {name: "DI", key: "di", order_by: "di", visible: true, order_direction: "", order: 2,
            format_fn: formatDoubleTo3},
        {name: "Sex", key: "sex", order_by: "sex", visible: true, order_direction: "", order: 2,
            format_fn: formatStr},
        {name: "Refuge Tag", key: "tag", order_by: "tag", visible: true, order_direction: "", order: 2,
            format_fn: formatStr},
        {name: "Box", key: "box", order_by: "box", visible: true, order_direction: "", order: 2,
            format_fn: formatStr}
    ];

    const handleFishUploadedCallback = () => {
        setReloadTable(reloadTable + 1);
    }

    const getExpandedRow = (fishId) => {
        return (ManageRowExpanded(fishId))
    }
    return (

        <div className="wrapper">
            <Container>
                <FishDataUpload dataUploadUrl="manage_fish/bulk_upload"
                                uploadCallback={handleFishUploadedCallback}
                                formModalTitle="Upload Bulk Fish Data (master sheet)"
                                uploadButtonText="Upload Fish"
                    />
                <Row>
                    <AmphiTable getTableDataUrl="manage_fish/get_fishes"
                                reloadData={reloadTable}
                                headerDataStart={FISH_HEADER}
                                getExpandedRow={getExpandedRow}
                    />
                </Row>
            </Container>

        </div>
   );
}