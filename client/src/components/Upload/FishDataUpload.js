import FileUploadSingle from "./SingleFileUpload";
import {Alert, Button, Row, UncontrolledAlert} from "reactstrap";
import React, {useState} from "react";
import PropTypes from "prop-types";


export default function FishDataUpload({dataUploadUrl, uploadCallback, uploadButtonText,
                                       formModalTitle, setIsLoading=null}) {
    const [formModal, setFormModal] = useState(false);
    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState("");

    const handleUploadFishDataClick = async e => {
        e.preventDefault();
        setFormModal(true);
    };

    const fishDataUploadCallback = result => {

        if ("success" in result) {
            let message = "Records successfully imported. ";
            for (let k in result['success']) {
                message += k + ": " + result['success'][k] + " ";
            }
            setAlertText(message);
            setAlertLevel("success");
            uploadCallback()
            return;
        }
        setAlertText(result["error"]);
        setAlertLevel("danger");
    };

    const fishDataUploadInProgress = () => {
        setFormModal(false);
        setAlertText("Bulk upload in progress...");
        setAlertLevel("info");
    }

    const fishDataUploadCancel = () => {
        setFormModal(false);
    }

    return (
        <>
            <Row>
                <UncontrolledAlert className="alert-with-icon" isOpen={alertText.length > 0} color={alertLevel}>
                    {alertLevel === "danger" && <strong>Error: </strong>} {alertText}
                </UncontrolledAlert>
            </Row>
            <Row>
                <FileUploadSingle formModalProp={formModal} fileUploadUrl={dataUploadUrl}
                                  submitReturnCallback={fishDataUploadCallback}
                                  submitCallback={fishDataUploadInProgress}
                                  cancelCallback={fishDataUploadCancel}
                                  formModalTitle={formModalTitle}
                                  setIsLoading={setIsLoading}/>
                <Button className="btn" color="default" type="button" onClick={handleUploadFishDataClick}>
                    {uploadButtonText}
                </Button>
            </Row>
        </>)

}
FishDataUpload.propTypes = {
    dataUploadUrl: PropTypes.string.isRequired,
    uploadCallback: PropTypes.func.isRequired,
    uploadButtonText: PropTypes.string.isRequired,
    formModalTitle: PropTypes.string.isRequired
}