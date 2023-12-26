import {Alert, Button, Container, Row} from "reactstrap";

import FishDataUpload from "../../components/Upload/FishDataUpload";
import React, {useState} from "react";
import {useOutletContext} from "react-router-dom";
import AmphiTable from "../../components/Table/AmphiTable";


export default function ManageFish() {
    const [reloadTable, setReloadTable] = useState(0);

    const FISH_HEADER = [
        {name: "Family ID", key: "group_id", order_by: "group_id", visible: true, order_direction: "ASC", order: 1},
        {name: "Sex", key: "sex", order_by: "sex", visible: true, order_direction: "", order: 2},
        {name: "Refuge Tag", key: "tag", order_by: "tag", visible: true, order_direction: "", order: 2},
        {name: "Box", key: "box", order_by: "box", visible: true, order_direction: "", order: 2}
    ];

    const handleFishUploadedCallback = () => {
        setReloadTable(reloadTable + 1);
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
                    />
                </Row>
            </Container>

        </div>
   );
}