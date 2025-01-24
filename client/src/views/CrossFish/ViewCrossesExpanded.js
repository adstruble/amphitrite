import {Col, FormGroup, Input, Label, Row, UncontrolledTooltip} from "reactstrap";
import PropTypes from "prop-types";
import React, {useState} from "react";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";
import {onKeyupWithDelay} from "../../components/Utils/General";
import classnames from "classnames";

export default function ViewCrossesExpanded({item, reloadTable, refugeCrosses}) {
    const [mfgIsValid, setMfgValid] = useState(true);
    const [mfg, setMfg] = useState(item['mfg'])
    const [mfgFocus, setMFGFocus] = useState(false);
    const {getUsername} = useToken();

    const maybeSetMfg = (newMFG) => {
        let isValid = false;
        if (newMFG != null){
            isValid = Number.isInteger(Number(newMFG))
            setMfgValid(isValid)
        }
        if (isValid && mfg !== newMFG){
            fetchData('cross_fish/set_mfg', getUsername(),
                {'mfg': newMFG, 'fam_id': item.id, 'refuge_crosses': refugeCrosses}, () => {
                    reloadTable();
                    setMfg(newMFG)
                });
        }
    }

    function setCrossFailed(value) {
        fetchData('cross_fish/set_cross_failed', getUsername(),
            {'cross_failed': value, 'fam_id': item.id, 'refuge_crosses': refugeCrosses}, () => {
                reloadTable();
            });
    }

    function setSupplementation(value) {
        fetchData('cross_fish/set_use_for_supplementation', getUsername(),
            {'use_for_supplementation': value, 'fam_id': item.id}, () => {
                reloadTable();
            });
    }

    function saveNotes(notes, family){
        fetchData("cross_fish/save_notes", getUsername(),
            {'fam_id': family['id'], 'notes':notes, 'supplementation': !refugeCrosses},
            ()=> {reloadTable()}
        )
    }

    let row_contents =
        <>
        <Col xs="2" style={{marginTop:"auto"}}>
            <FormGroup className={classnames({"input-group-focus": mfgFocus}, "tank-group")}>
                <label>{refugeCrosses ? "MFG" : "Tank"}</label>
                <Input
                    onFocus={() => setMFGFocus(true)}
                    onBlur={() => setMFGFocus(false)}
                    defaultValue={item['mfg']}
                    type="text"
                    onKeyUp={onKeyupWithDelay((e) => maybeSetMfg(e.target.value),
                        750)}
                />
                {!mfgIsValid && <p>{refugeCrosses ? "MFG" : "Tank"} must be set to an integer.</p>}
            </FormGroup>
        </Col>
        <Col xs="3" style={{marginTop:"auto"}}>
            <FormGroup check>
                <Label check>
                    <Input defaultChecked={item['cross_failed']} type="checkbox"
                           onChange={(e) => setCrossFailed(e.target.checked)}/>
                    <span className="form-check-sign"/>
                    Cross failed
                </Label>
            </FormGroup>
            {refugeCrosses &&
            <FormGroup check>
                <Label check>
                    <Input defaultChecked={item['supplementation'] > 0} type="checkbox"
                           checked={item['supplementation'] > 0}
                           onChange={(e) => setSupplementation(e.target.checked)}/>
                    <span className="form-check-sign" id={'id' + item['id']+'supplcheck'}>
                        <UncontrolledTooltip
                            placement={"top-start"}
                            target={'id' + item['id']+'supplcheck'}>
                            {'When selecting, all MFG families will be included in supplementation. To include only some families of a MFG, deselect those not included.'}
                        </UncontrolledTooltip>
                    Cross included in supplementation
                    </span>
                </Label>
            </FormGroup>}
        </Col>
        </>


    return (
        <tr className='expanded-row-contents'>
            <td>
                <Row>
                    {row_contents}
                    <Col xs="7" style={{marginTop:"auto"}}>
                        <div>
                            <span>Notes</span>
                        </div>
                        <div>
                            <Input type="textarea"
                                   defaultValue={item['notes']}
                                   className="form-control"
                                   id="famNotesArea" rows="2"
                                   onKeyUp={onKeyupWithDelay((e) => saveNotes(e.target.value, item), 500)}/>
                        </div>
                    </Col>
                </Row>
            </td>
        </tr>
    );
}

ViewCrossesExpanded.propTypes = {
    item: PropTypes.any.isRequired,
    reloadTable: PropTypes.func.isRequired,
    refugeCrosses: PropTypes.bool.isRequired
}
