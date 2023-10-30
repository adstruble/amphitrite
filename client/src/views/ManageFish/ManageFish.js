import {Alert, Button, Container, Row} from "reactstrap";

import FileUploadSingle from "../../components/Upload/SingleFileUpload";
import React, {useState} from "react";
import {useOutletContext} from "react-router-dom";
import AmphiTable from "../../components/Table/AmphiTable";


export default function ManageFish() {
    const [formModal, setFormModal] = useState(false);
    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState(""); //useOutletContext();
    const [reloadTable, setReloadTable] = useState(0);

    const FISH_HEADER = [
        {name: "Family ID", col_key: "group_id", order_by: "group_id", visible: true, order_direction: "DESC"},
        {name: "Sex", col_key: "sex", order_by: "sex", visible: true, order_direction: "ASC"},
        {name: "Refuge Tag", col_key: "tag", order_by: "tag", visible: true, order_direction: "ASC"},
        {name: "Box", col_key: "box", order_by: "box", visible: true, order_direction: "ASC"}
    ];

    const handleUploadFishClick = async e => {
        e.preventDefault();
        setFormModal(true);
    };


    const fishUploadCallback = result => {

        if ("success" in result) {
            let message = "Records successfully imported. ";
            for (let k in result['success']) {
                message += k + ": " + result['success'][k] + " ";
            }
            setAlertText(message);
            setAlertLevel("success");
            setReloadTable(reloadTable + 1);
            return;
        }
        setAlertText(result["error"]);
        setAlertLevel("danger");
    };

    const fishUploadInProgress = () => {
        setFormModal(false);
        setAlertText("Bulk upload in progress...");
        setAlertLevel("info");
    }

    const fishUploadCancel = () => {
        setFormModal(false);
    }

    return (

        <div className="wrapper">
            <Container>
                <Row>
                    <Alert isOpen={alertText.length > 0} color={alertLevel} onClose={() => setAlertText("")} dismissible>
                        {alertLevel === "danger" && <strong>Error: </strong>} {alertText}
                    </Alert>
                </Row>
                <Row>
                    <FileUploadSingle formModalProp={formModal} fileUploadUrl="manage_fish/bulk_upload"
                                      submitReturnCallback={fishUploadCallback} submitCallback={fishUploadInProgress}
                    cancelCallback={fishUploadCancel}/>
                    <Button className="btn" color="default" type="button" onClick={handleUploadFishClick}>
                        Upload Fish
                    </Button>
                </Row>
                <Row style={{ marginTop:-50 }}>
                    <AmphiTable getTableDataUrl="manage_fish/get_fishes"
                                reloadData={reloadTable}
                                headerData={FISH_HEADER}
                    />
                </Row>
            </Container>

        </div>
   );
}