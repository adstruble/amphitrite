import {
    Col,
    Input,
    Row
} from "reactstrap";
import PropTypes from "prop-types";
import React, {useState} from "react";

export function ViewCrossesFilter({setFilterParent}) {
    const [initLoad, setInitLoad] = useState(true);

    React.useEffect(()=>{setFilter(); setInitLoad(false)}, [])

    function setFilter(){
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
        setFilterParent(filter, initLoad);
    }

    function getIntFilter(elementId, sqlSelector, filter, allowWT=true){
        const elemVal = document.getElementById(elementId).value.trim()
        if (elemVal !== ""){
            if(!isNaN(parseInt(elemVal))){
                filter[sqlSelector] = parseInt(elemVal);
            }else if(allowWT && elemVal === "WT"){
                filter[sqlSelector] = -1;
            }else{
                filter[sqlSelector] = 0;
            }
        }
    }

    return (
        <div className="input-area">
            <Row>
                <Col>
                    <span>PC/FSG:</span>
                </Col>
                <Col>
                    <Input id="groupId" style={{width:"auto"}} onChange={()=>setFilter()}/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>MFG:</span>
                </Col>
                <Col>
                    <Input id="mfg" style={{width:"auto"}} onChange={()=>setFilter()}/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>Female PC/FSG:</span>
                </Col>
                <Col>
                    <Input id="fGroupId" style={{width:"auto"}} onChange={()=>setFilter()}/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>Female Fish Tag:</span>
                </Col>
                <Col>
                    <Input id="fTag" style={{width:"auto"}} onChange={()=>setFilter()}/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>Male PC/FSG:</span>
                </Col>
                <Col>
                    <Input id="mGroupId" style={{width:"auto"}} onChange={()=>setFilter()}/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>Male Fish Tag:</span>
                </Col>
                <Col>
                    <Input id="mTag" style={{width:"auto"}} onChange={()=>setFilter()}/>
                </Col>
            </Row>
        </div>
    )
}

ViewCrossesFilter.propTypes = {
    setFilterParent: PropTypes.func.isRequired
}