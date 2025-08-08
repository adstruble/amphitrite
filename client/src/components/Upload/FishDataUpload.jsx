import FileUploadSingle from "./SingleFileUpload";
import {Button} from "reactstrap";
import React, {useState} from "react";
import PropTypes from "prop-types";


export default function FishDataUpload({dataUploadUrl, uploadCallback, uploadButtonText,
                                           formModalTitle, setIsLoading=null,
                                           fileNameStartText='No file chosen',
                                           setAlertText, setAlertLevel, UserOptions, uploadParams={},
                                           showFormModalFromParent, setShowFormModalFromParent}
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
        if (setShowFormModalFromParent !== undefined){
            setShowFormModalFromParent(false)
        }
        setAlertText("Bulk upload in progress...");
        setAlertLevel("info");
    }

    const fishDataUploadCancel = () => {
        setFormModal(false);
        if (setShowFormModalFromParent !== undefined){
            setShowFormModalFromParent(false)
        }
    }

    return (
        <>
            <FileUploadSingle formModalProp={formModal || showFormModalFromParent} fileUploadUrl={dataUploadUrl}
                              submitReturnCallback={fishDataUploadCallback}
                              submitCallback={fishDataUploadInProgress}
                              cancelCallback={fishDataUploadCancel}
                              formModalTitle={formModalTitle}
                              setIsLoading={setIsLoading}
                              fileNameStartText={fileNameStartText}
                              UserOptions={UserOptions}
                              uploadParams={uploadParams}
            />
            {showFormModalFromParent === undefined  && <Button id={uploadButtonText.replace(/ /g,'')} className="btn" color="default" type="button" onClick={handleUploadFishDataClick}>
                {uploadButtonText}
            </Button>}
        </>
    )

}
FishDataUpload.propTypes = {
    dataUploadUrl: PropTypes.string.isRequired,
    uploadCallback: PropTypes.func.isRequired,
    uploadButtonText: PropTypes.string.isRequired,
    formModalTitle: PropTypes.string.isRequired,
    UserOptions: PropTypes.elementType
}