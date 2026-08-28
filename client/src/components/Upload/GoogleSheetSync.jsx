import React, {useState} from "react";
import {Button, Modal, Table} from "reactstrap";
import PropTypes from "prop-types";
import useToken from "../App/useToken";

// "Sync from Google Sheets" with a pull -> preview -> commit flow. The preview parses the sheet
// WITHOUT writing, so the user can confirm parsed rows / see skipped tabs and validation flags
// before anything is persisted (guards against ingesting messy or in-progress data).
export default function GoogleSheetSync({previewUrl, commitUrl, buttonText, modalTitle,
                                           setAlertText, setAlertLevel, onCommitted}) {
    const {getUsername} = useToken();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [committing, setCommitting] = useState(false);
    const [preview, setPreview] = useState(null);
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);

    const headers = () => ({username: getUsername(), 'Content-Type': 'application/json'});

    const openAndPreview = () => {
        setOpen(true);
        setLoading(true);
        setError(null);
        setPreview(null);
        setToken(null);
        fetch(`/amphitrite/${previewUrl}`, {method: "POST", headers: headers()})
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setPreview(data.preview);
                    setToken(data.token);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    const commit = () => {
        setCommitting(true);
        fetch(`/amphitrite/${commitUrl}`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({token}),
        })
            .then(res => res.json())
            .then(data => {
                if ("success" in data) {
                    let message = "Records successfully imported.";
                    for (let k in data.success.inserted) {
                        message += " " + k + " insertions: " + data.success.inserted[k] + ".";
                    }
                    setAlertText(message);
                    setAlertLevel("success");
                    onCommitted();
                    setOpen(false);
                } else {
                    setAlertText(data.error);
                    setAlertLevel("danger");
                    setOpen(false);
                }
            })
            .catch(err => {
                setAlertText(err.message);
                setAlertLevel("danger");
                setOpen(false);
            })
            .finally(() => setCommitting(false));
    };

    return (
        <>
            <Button className="btn" color="default" type="button" onClick={openAndPreview}>
                {buttonText}
            </Button>
            <Modal modalClassName="modal-black" isOpen={open} toggle={() => setOpen(false)} size="lg">
                <div className="modal-header justify-content-center">
                    <button className="btn-close" onClick={() => setOpen(false)}>
                        <i className="tim-icons icon-simple-remove text-white"/>
                    </button>
                    <div className="text-muted text-center ml-auto mr-auto">
                        <h3 className="mb-0">{modalTitle}</h3>
                    </div>
                </div>
                <div className="modal-body">
                    {loading && <p>Reading Google Sheet…</p>}
                    {error && <p className="text-danger"><strong>Error:</strong> {error}</p>}
                    {preview && (
                        <>
                            <p>{preview.total_rows} rows across {preview.sheets.length} recognized sheet(s).</p>
                            <Table className="table" size="sm">
                                <thead>
                                    <tr><th>Sheet</th><th>Facility</th><th>System</th><th>Year</th><th>Rows</th></tr>
                                </thead>
                                <tbody>
                                    {preview.sheets.map(s => (
                                        <tr key={s.sheet_name}>
                                            <td>{s.sheet_name}</td>
                                            <td>{s.facility}</td>
                                            <td>{s.system || ''}</td>
                                            <td>{s.sheet_year}</td>
                                            <td>{s.row_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            {preview.skipped.length > 0 && (
                                <p className="text-warning">
                                    Skipped (unrecognized) sheets: {preview.skipped.join(', ')}
                                </p>
                            )}
                            {preview.flags.length > 0 && (
                                <div className="text-warning" style={{maxHeight: '150px', overflowY: 'auto'}}>
                                    <strong>Validation warnings:</strong>
                                    <ul>{preview.flags.map((f, i) => <li key={i}>{f}</li>)}</ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="modal-footer">
                    <Button color="default" className="btn" type="button"
                            onClick={() => setOpen(false)}>Cancel</Button>
                    <Button color="success" type="button" onClick={commit}
                            disabled={!token || committing}>
                        {committing ? "Importing…" : "Confirm & Import"}
                    </Button>
                </div>
            </Modal>
        </>
    );
}

GoogleSheetSync.propTypes = {
    previewUrl: PropTypes.string.isRequired,
    commitUrl: PropTypes.string.isRequired,
    buttonText: PropTypes.string.isRequired,
    modalTitle: PropTypes.string.isRequired,
    setAlertText: PropTypes.func.isRequired,
    setAlertLevel: PropTypes.func.isRequired,
    onCommitted: PropTypes.func.isRequired,
};
