import {Alert, Button, Container, Modal, Row, Table} from "reactstrap";
import FileUploadSingle from "../../components/Upload/SingleFileUpload";
import React, {useState} from "react";
import {useOutletContext} from "react-router-dom";
export default function ManageFish() {
    const [formModal, setFormModal] = useState(false);

    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState(""); //useOutletContext();

    const handleUploadFishClick = async e => {
        e.preventDefault();
        setFormModal(true);
    }

    const fishUploadCallback = result => {

        if ("success" in result) {
            let message = "Records successfully imported. ";
            for (let k in result['success']) {
                message += k + ": " + result['success'][k] + " ";
            }
            setAlertText(message);
            setAlertLevel("success");
            return;
        }
        setAlertText(result["error"]);
        setAlertLevel("danger");
    }

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
                <Row>
                    <Table>

                    </Table>
                </Row>
            </Container>

        </div>
   );
}