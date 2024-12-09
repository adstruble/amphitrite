import {Col, FormGroup, Input, Label, Row, UncontrolledTooltip} from "reactstrap";
import PropTypes from "prop-types";
import React, {useState} from "react";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";
import {onKeyupWithDelay} from "../../components/Utils/General";

export default function ViewCrossesExpanded({item, reloadTable, refugeCrosses}) {
    const [mfgIsValid, setMfgValid] = useState(true);
    const [mfg, setMfg] = useState(item['mfg'])
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
            {'cross_failed': value, 'fam_id': item.id}, () => {
            });
    }

    function setSupplementation(value) {
        fetchData('cross_fish/set_use_for_supplementation', getUsername(),
            {'use_for_supplementation': value, 'fam_id': item.id}, () => {
                reloadTable();
            });
    }

    let row_contents;
    if (refugeCrosses){
        row_contents =
            <Row>
                <Col xs="3">
                    <FormGroup>
                        <label>MFG</label>
                        <Input
                            defaultValue={item['mfg']}
                            type="text"
                            onKeyUp={onKeyupWithDelay((e) => maybeSetMfg(e.target.value),
                                750)}
                        />
                        {!mfgIsValid && <p>MFG must be set to an integer.</p>}
                    </FormGroup>
                </Col>
                <Col xs="6">
                    <FormGroup check>
                        <Label check>
                            <Input defaultChecked={item['cross_failed']} type="checkbox"
                                   onChange={(e) => setCrossFailed(e.target.checked)}/>
                            <span className="form-check-sign"/>
                            Cross failed
                        </Label>
                    </FormGroup>
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
                    </FormGroup>
                </Col>
            </Row>
    }
    else{
        row_contents =
            <Row>
                <Col xs="3">
                    <FormGroup>
                        <label>Tank</label>
                        <Input
                            defaultValue={item['mfg']}
                            type="text"
                            onKeyUp={onKeyupWithDelay((e) => maybeSetMfg(e.target.value),
                                750)}
                        />
                        {!mfgIsValid && <p>Tank must be set to an integer.</p>}
                    </FormGroup>
                </Col>
            </Row>
    }

    return (
        <tr className='expanded-row-contents'>
            <td>
                {row_contents}
            </td>
        </tr>
    );
}

ViewCrossesExpanded.propTypes = {
    item: PropTypes.any.isRequired,
    reloadTable: PropTypes.func.isRequired,
    refugeCrosses: PropTypes.bool.isRequired
}
