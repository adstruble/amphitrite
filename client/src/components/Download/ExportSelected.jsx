import React, {useState} from "react";
import PropTypes from "prop-types";
import {Alert, Button, Col, FormGroup, Input, Label, Modal, Row} from "reactstrap";
import RadioGroup from "../Basic/RadioGroup";
import classNames from "classnames";
import fetchFile from "../../server/fetchFile";
import useToken from "../App/useToken";
import {getCurrentTableSelection} from "../Table/AmphiTableUtils";
import AmphiAlert from "../Basic/AmphiAlert.jsx";

export default function ExportSelected({exportUrl, exportButtonText,
                                        fileName,
                                           exportColumns,
                                           formModalTitle,
                                           setAlertText, setAlertLevel, allStr,
                                       filter,
                                       search}
) {
    const {getUsername} = useToken();
    const [formModal, setFormModal] = useState(false);
    const exportSelectedOnlyLabel = 'Export selected only';
    const [exportSelectedOnly, setExportSelectedOnly] = useState(true);
    const [currentTableSelection, setCurrentTableSelection] = useState(null);
    const [error, setError] = useState(null);

    const handleOuterExportBtnClick = async e => {
        e.preventDefault();
        setFormModal(true);
        const selection = window.getSelection();
        setCurrentTableSelection({
            'type': selection.type,
            'anchorNode': selection.anchorNode,
            'focusNode': selection.focusNode});
    };

    function handleModalExportClick() {
        let modalError = false;
        exportColumns.map(col => {
            if (col.variable && col.selected){
                let error = col.validate_fn(col.variable_val);
                setError(error);
                if (error){
                    modalError = true;
                }
            }
        })
        if(modalError){
            return
        }
        exportInProgress();
        let params = {'export_columns': exportColumns, 'offset':0, 'limit': null}
        exportColumns.map(col => {
            if (col.variable && col.selected){
                params[col.field] =  col.variable_val;
            }
        });
        if(exportSelectedOnly){
            const ids = getCurrentTableSelection("fish", currentTableSelection);
            if(ids[0] === 'error'){
                setAlertLevel('danger');
                setAlertText(ids[1])
                return
            }
            params = {...params, ...{'exact_filters':{'ids': ids}, 'like_filter': ""}};
        }else{
            params = {...params,...{'exact_filters': filter, 'like_filter': search}}
        }
        fetchFile(exportUrl, fileName, getUsername(), params,() =>{exportComplete()},
            (msg)=>{exportFailed(msg)})
    }

    const exportInProgress = () => {
        setFormModal(false);
        setAlertText("Export in progress...");
        setAlertLevel("info");
    }

    function exportComplete() {
        setAlertText("Export completed.");
        setAlertLevel("success");
    }

    function exportFailed(msg) {
        setAlertText("Export failed due to: " + msg);
        setAlertLevel("danger");
    }

    const cancelCallback = () => {
        setFormModal(false);
    }

    const halfCols = Math.ceil(exportColumns.length / 2)

    function handleColClick (checkbox, col){
        col.selected = checkbox.checked;
    }

    function setColVariable(col, value){
        setError(col.validate_fn(value));
        col.variable_val = value;
    }

    function getColRow(col){
        return(
            <Row>
                <FormGroup check>
                    <Label check>
                        <Input type="checkbox" defaultChecked={col.selected} defaultValue={col.name}
                               onClick={(evt)=>handleColClick(evt.target, col)}/>
                        <span className="form-check-sign" />
                        {col.name}
                        {col.variable && <Input id={col.name + 'variable'} type="text" placeholder={col.variable}
                                                onChange={e => setColVariable(col, e.target.value)}/>}
                    </Label>
                </FormGroup>
            </Row>
        )
    }

    function radioSelectionTypeCallback(radioLabel){
        if(radioLabel === exportSelectedOnlyLabel){
            setExportSelectedOnly(true);
        }else{
            setExportSelectedOnly(false);
        }
    }
    return(
        <>
        <Button id={exportButtonText.replace(/ /g,'')} className="btn" color="default"
                type="button" onClick={handleOuterExportBtnClick}>
            {exportButtonText}
        </Button>
        <Modal
            modalClassName="modal-black"
            isOpen={formModal}
            toggle={() => setFormModal(false)}>
            <div>

            <div className="modal-header justify-content-center">
                <button className="btn-close" onClick={cancelCallback}>
                    <i className="tim-icons icon-simple-remove text-white"/>
                </button>
                <div className="text-muted text-center ml-auto mr-auto">
                    <h3 className="mb-0">{formModalTitle}</h3>
                </div>
            </div>
                {error && (
                    <AmphiAlert alertText={error} alertLevel='danger' setAlertText={setError}/>
                )}
            <div className={classNames("modal-body", 'export')}>
                <Row>
                    <RadioGroup items={[exportSelectedOnlyLabel, "Export all (" + allStr + ")"]}
                                selectedItem={exportSelectedOnlyLabel}
                                radioSelectedCallback={radioSelectionTypeCallback}
                                sideBySide={true}/>

                </Row>
                <Row>
                    <p className="category">Select columns to include in export</p>
                </Row>
                <Row>
                    <Col>
                        {exportColumns.slice(0, halfCols).map(col => {
                            return getColRow(col);
                        })}
                    </Col>
                    <Col>
                        {exportColumns.slice(halfCols).map(col => {
                            return getColRow(col);
                        })}
                    </Col>
                </Row>
            </div>
            <div className="modal-footer">
                <Button color="default" className="btn" type="button"
                        onClick={cancelCallback}>Cancel</Button>

                <Button color="success" type="button" onClick={handleModalExportClick}>Export</Button>
            </div>
            </div>
        </Modal>
        </>
    );
}

ExportSelected.propTypes = {
    exportUrl: PropTypes.string.isRequired,
    exportCallback: PropTypes.func.isRequired,
    exportButtonText: PropTypes.string.isRequired,
    formModalTitle: PropTypes.string.isRequired,
    exportColumns: PropTypes.array.isRequired,
    setAlertText: PropTypes.func,
    setAlertLevel: PropTypes.func
}
