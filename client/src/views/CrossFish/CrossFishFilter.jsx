import {
    Col,
    Input,
    Row
} from "reactstrap";
import PropTypes from "prop-types";
import React, {useState} from "react";

export function CrossFishFilter({setFilterParent}) {
    const [initLoad, setInitLoad] = useState(true);

    React.useEffect(()=>{setFilter(); setInitLoad(false)}, [])
    function setFilter(){
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
        setFilterParent(filter, initLoad);
    }

    return (
        <div className="input-area">
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

CrossFishFilter.apropTypes = {
    setFilterParent: PropTypes.func.isRequired
}