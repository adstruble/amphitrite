import {
    Button,
    Col,
    Dropdown, DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Input,
    Row
} from "reactstrap";
import PropTypes from "prop-types";
import React, {useState} from "react";
import {CrossYearDropdown} from "../../components/Basic/CrossYearDropdown";
import ClickOutsideAlerter from "../../components/Utils/ClickOutsiderAlerter";

export function ViewCrossesFilter({applyFilterCallback, showFilter}) {
    const filterWidth = "550px"; //matchWidthElementId ? parseInt(getComputedStyle(document.getElementById(matchWidthElementId))['width'])/2 : "100%";


    function getFilters(){
        let filter = {}
        getIntFilter('groupId', 'completed_cross.group_id', filter, false);
        getIntFilter('mfg', 'completed_cross.mfg', filter, false);
        getIntFilter('fGroupId', "xf.group_id", filter);
        getIntFilter('mGroupId', "yf.group_id", filter);

        const fTag = document.getElementById("fTag").value.trim()
        if (fTag !== ""){
            filter['rtx.tag'] = fTag;
        }
        const mTag = document.getElementById("mTag").value.trim()
        if (mTag !== ""){
            filter['rty.tag'] = mTag;
        }
        return filter;
    }

    function getIntFilter(elementId, sqlSelector, filter, allowWT=true){
        const elemVal = document.getElementById(elementId).value.trim()
        if (elemVal !== ""){
            if(!isNaN(parseInt(elemVal))){
                filter[sqlSelector] = parseInt(elemVal);
            }else if(allowWT && elemVal === "WT"){
                filter[sqlSelector] = -1;
            }
        }
    }

    return (
        <ClickOutsideAlerter clickedOutsideCallback={applyFilterCallback} show={showFilter}>
            <div style={{width: filterWidth}}
                 className="filter" id="filterTable">
                <div style={{border: "1px solid #1d8cf8", padding: "10px"}}>
                    <div className="input-area">
                        <Row>
                            <Col>
                                <span>PC/FSG:</span>
                            </Col>
                            <Col>
                                <Input id="groupId" style={{width:"auto"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span>MFG:</span>
                            </Col>
                            <Col>
                                <Input id="mfg" style={{width:"auto"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span>Female PC/FSG:</span>
                            </Col>
                            <Col>
                                <Input id="fGroupId" style={{width:"auto"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span>Female Fish Tag:</span>
                            </Col>
                            <Col>
                                <Input id="fTag" style={{width:"auto"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span>Male PC/FSG:</span>
                            </Col>
                            <Col>
                                <Input id="mGroupId" style={{width:"auto"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span>Male Fish Tag:</span>
                            </Col>
                            <Col>
                                <Input id="mTag" style={{width:"auto"}}/>
                            </Col>
                        </Row>
                    </div>
                    <div style={{display:"flex", justifyContent:"flex-end"}}>
                        <Button type="button" onClick={()=>applyFilterCallback(getFilters())}>Search</Button>
                    </div>
                </div>
            </div>
        </ClickOutsideAlerter>
    )
}

ViewCrossesFilter.propTypes = {
    applyFilterCallback: PropTypes.func.isRequired,
    showFilter: PropTypes.any.isRequired
}