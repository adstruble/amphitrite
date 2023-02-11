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

    const fishUploadedSuccess = message => {
        setFormModal(false);
        if (message === "cancel"){
            return;
        }
        setAlertText(message);
        setAlertLevel("success");
    }

    return (
        <div className="wrapper">
            <Container>
                <Row>
                    <Alert isOpen={alertText.length > 0} color={alertLevel} onClose={() => setAlertText("")} dismissible>
                        <>if (alertLevel == "danger"){<strong>Error: </strong>}</><>{alertText}</>
                    </Alert>
                </Row>
                <Row>
                    <FileUploadSingle formModalProp={formModal} fileUploadUrl="manage_fish/bulk_upload"
                                      closeCallback={fishUploadedSuccess}/>

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