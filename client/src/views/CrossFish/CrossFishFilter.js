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

export function CrossFishFilter({applyFilterCallback, showFilter}) {
    const filterWidth = "550px"; //matchWidthElementId ? parseInt(getComputedStyle(document.getElementById(matchWidthElementId))['width'])/2 : "100%";


    function getFilters(){
        let filter = {}
        const fGroupId = document.getElementById("fGroupId").value.trim()
        if (fGroupId !== ""){
            if(!isNaN(parseInt(fGroupId))){
                filter['xf.group_id'] = parseInt(fGroupId);
            }
        }
        const mGroupId = document.getElementById("mGroupId").value.trim()
        if (mGroupId !== ""){
            if(!isNaN(parseInt(mGroupId))){
                filter['yf.group_id'] = parseInt(mGroupId);
            }
        }
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

    return (
        <ClickOutsideAlerter clickedOutsideCallback={applyFilterCallback} show={showFilter}>
            <div style={{width: filterWidth}}
                 className="filter" id="filterTable">
                <div style={{border: "1px solid #1d8cf8", padding: "10px"}}>
                    <div className="input-area">
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

CrossFishFilter.propTypes = {
    applyFilterCallback: PropTypes.func.isRequired,
    showFilter: PropTypes.any.isRequired
}