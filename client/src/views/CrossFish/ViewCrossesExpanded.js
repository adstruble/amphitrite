import {Col, FormGroup, Input, Label, Row} from "reactstrap";
import PropTypes from "prop-types";
import React, {useState} from "react";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";
import {onKeyupWithDelay} from "../../components/Utils/General";

export default function ViewCrossesExpanded({item, reloadTable}) {
    const [mfgIsValid, setMfgValid] = useState(true);
    const [mfg, setMfg] = useState(item['mfg'])
    const {_, __, getUsername} = useToken();

    const maybeSetMfg = (newMFG) => {
        let isValid = false;
        if (newMFG != null){
            isValid = Number.isInteger(Number(newMFG))
            setMfgValid(isValid)
        }
        if (isValid && mfg !== newMFG){
            fetchData('cross_fish/set_mfg', getUsername(),
                {'mfg': newMFG, 'fam_id': item.id}, () => {
                    reloadTable();
                    setMfg(newMFG)
                });
        }
    }

    function setCrossFailed(value) {
        fetchData('cross_fish/set_cross_failed', getUsername(),
            {'cross_failed': value, 'fam_id': item.id}, () => {
                reloadTable();
            });
    }

    function setSupplementation(value) {
        fetchData('cross_fish/set_use_for_supplementation', getUsername(),
            {'use_for_supplementation': value, 'fam_id': item.id}, () => {
            });
    }

    return (
        <tr className='expanded-row-contents'>
            <td>
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
                                       onChange={(e) => setSupplementation(e.target.checked)}/>
                                <span className="form-check-sign"/>
                                Cross included in supplementation
                            </Label>
                        </FormGroup>
                    </Col>
                </Row>
            </td>
        </tr>
    );
}

ViewCrossesExpanded.propTypes = {
    item: PropTypes.any.isRequired,
    reloadTable: PropTypes.func.isRequired
}
