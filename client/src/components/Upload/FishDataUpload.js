import FileUploadSingle from "./SingleFileUpload";
import {Alert, Button, Row, UncontrolledAlert} from "reactstrap";
import React, {useState} from "react";
import PropTypes from "prop-types";


export default function FishDataUpload({dataUploadUrl, uploadCallback, uploadButtonText,
                                       formModalTitle, setIsLoading=null,
                                       fileNameStartText='No file chosen',
                                       setAlertText, setAlertLevel}
) {
    const [formModal, setFormModal] = useState(false);

    const handleUploadFishDataClick = async e => {
        e.preventDefault();
        setFormModal(true);
    };

    const fishDataUploadCallback = result => {

        if ("success" in result) {
            let message = "Records successfully imported.";
            for (let k in result['success']['inserted']) {
                message += " " + k + " insertions: " + result['success']['inserted'][k];
            }
            if ("inserted" in result['success']) {
                message += "."
            }
            for (let k in result['success']['updated']) {
                message += " " + k + " updates: " + result['success']['updated'][k];
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
            <FileUploadSingle formModalProp={formModal} fileUploadUrl={dataUploadUrl}
                              submitReturnCallback={fishDataUploadCallback}
                              submitCallback={fishDataUploadInProgress}
                              cancelCallback={fishDataUploadCancel}
                              formModalTitle={formModalTitle}
                              setIsLoading={setIsLoading}
                              fileNameStartText={fileNameStartText}/>
            <Button className="btn" color="default" type="button" onClick={handleUploadFishDataClick}>
                {uploadButtonText}
            </Button>
        </>
    )

}
FishDataUpload.propTypes = {
    dataUploadUrl: PropTypes.string.isRequired,
    uploadCallback: PropTypes.func.isRequired,
    uploadButtonText: PropTypes.string.isRequired,
    formModalTitle: PropTypes.string.isRequired
}