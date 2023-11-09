import React, {useEffect, useState} from 'react';
import {Alert, Button, Input, Modal} from "reactstrap";
import PropTypes from "prop-types";
import useToken from "../App/useToken";

export default function FileUploadSingle({fileUploadUrl,
                                             submitReturnCallback,
                                             submitCallback,
                                             cancelCallback,
                                             formModalProp,
                                         formModalTitle}) {

    const [formModal, setFormModal] = useState(false);
    const [file, setFile] = useState();
    const [fileName, setFileName] = useState('No file chosen');
    const [submitDisabled, setSubmitDisabled] = useState(true);
    const {token, setToken, getUsername} = useToken();
    const [showSubmitAlert, setShowSubmitAlert] = useState(false);
    const [submitAlert, setSubmitAlert] = useState("Unknown error")

    useEffect(() => {
        setFormModal(formModalProp );
    }, [formModalProp]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            if (e.target.value.length > 0) {
                setFile(e.target.files[0]);
                setFileName(e.target.value.split('\\').pop());
                setSubmitDisabled(false)
            }
        }
    };

    const handleUploadClick = () => {
        if (!file) {
            return;
        }
        setSubmitDisabled(true);
        const formData = new FormData();
        formData.append('file', file);
        // 👇 Uploading the file using the fetch API to the server
        fetch("/amphitrite/" + fileUploadUrl, {
            method: "POST",
            headers: {
                username: getUsername()
            },
            body: formData,
        })
            .then((res) => res.json())
            .then((data) => {
                submitReturnCallback(data);
                setSubmitDisabled(false);
            }
            )
            .catch((err) => {
                    console.error(err);
                    setSubmitDisabled(false);
                    submitReturnCallback({"error": err.message});
                }
            )

        submitCallback();
    };


    return(
        <Modal
            modalClassName="modal-black"
            isOpen={formModal}
            toggle={() => setFormModal(false)}>
            <div className="modal-header justify-content-center">
                <button className="btn-close" onClick={cancelCallback}>
                    <i className="tim-icons icon-simple-remove text-white" />
                </button>
                <div className="text-muted text-center ml-auto mr-auto">
                    <h3 className="mb-0">{formModalTitle}</h3>
                </div>
            </div>
            <div className="modal-body">
                <div>
                    <Alert isOpen={showSubmitAlert}
                           color="danger"
                           toggle={() => setShowSubmitAlert(false)}
                           dismissible>
                        <strong>Error:</strong><> {submitAlert}</>
                    </Alert>
                    <div>
                        <Input className="" type="file" name="file" id="file_input" onChange={handleFileChange}/>
                        <label htmlFor="file_input">Choose File</label>
                        <span>{fileName}</span>
                    </div>
                </div>
            </div>
            <div className="modal-footer">
                    <Button color="default" className="btn" type="button"
                            onClick={cancelCallback}>Cancel</Button>

                    <Button color="success" type="button" onClick={handleUploadClick}
                            disabled={submitDisabled}>Submit</Button>
                </div>
        </Modal>

    )
}
FileUploadSingle.propTypes = {
    fileUploadUrl: PropTypes.string.isRequired,
    submitReturnCallback: PropTypes.func.isRequired,
    submitCallback: PropTypes.func.isRequired,
    cancelCallback: PropTypes.func.isRequired,
    formModalProp: PropTypes.bool.isRequired,
    formModalTitle: PropTypes.string.isRequired
}
