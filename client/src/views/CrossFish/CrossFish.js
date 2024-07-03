import {Container, Row} from "reactstrap";

import FishDataUpload from "../../components/Upload/FishDataUpload";
import React from "react";
import AmphiTable from "../../components/Table/AmphiTable";


export default function CrossFish() {

    const handleUploadCrossesClick = async e => {
        console.log("Crosses upload callback")
    };

    const CROSSES_HEADER = [
        {name: "Family ID", key: "group_id", order_by: "group_id", visible: true, order_direction: "ASC", order: 1,
            format_fn: formatStr},
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

    return (

        <div className="wrapper">
            <Container>
                <!--FishDataUpload
                    dataUploadUrl="cross_fish/upload_crosses"
                    uploadCallback={handleUploadCrossesClick}
                    formModalTitle="Upload Recommended Crosses"
                    uploadButtonText="Upload Crosses"
                /-->
                <Row>
                    <AmphiTable getTableDataUrl="cross_fish/get_best_available"
                                reloadData={reloadTable}
                                headerDataStart={CROSSES_HEADER}
                                getExpandedRow={getExpandedRow}
                    />
                </Row>
            </Container>
        </div>
    )
}