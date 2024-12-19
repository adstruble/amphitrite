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
import {CrossYearDropdown} from "../Basic/CrossYearDropdown";
import ClickOutsideAlerter from "../Utils/ClickOutsiderAlerter";

export function FilterOptions({applyFilterCallback, showFilter}) {
    const filterWidth = "550px"; //matchWidthElementId ? parseInt(getComputedStyle(document.getElementById(matchWidthElementId))['width'])/2 : "100%";
    const [year, setYear] = useState('All');
    const [sex, setSex] = useState('Both');
    const [sexDropdownOpen, setSexDropdownOpen] = useState(false);

    function toggleSexDropdown(){
        setSexDropdownOpen((prevState) => !prevState);
    }
    function getFilters(){
        let filter = {}
        if (year !== 'All'){
            filter['cross_year'] = year
        }
        if (sex !== 'Both'){
            filter['sex'] = sex[0].toUpperCase()
        }
        const groupId = document.getElementById("groupId").value.trim();
        if (groupId !== ""){
            filter['group_id'] = groupId;
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
                                <span>Year parents were crossed:</span>
                            </Col>
                            <Col>
                                <CrossYearDropdown yearSelectedCallback={setYear} includeAllYears={true}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span>Family ID:</span>
                            </Col>
                            <Col>
                                <Input id="groupId" style={{width:"auto"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span>Sex:</span>
                            </Col>
                            <Col>
                                <Dropdown isOpen={sexDropdownOpen} toggle={toggleSexDropdown} >
                                    <DropdownToggle style={{paddingTop: 0, paddingLeft: 0}}
                                                    aria-expanded={false}
                                                    aria-haspopup={true}
                                                    caret
                                                    color="default"
                                                    data-toggle="dropdown"
                                                    id="sexFilterDropdown"
                                                    nav
                                    >
                                        <span id="completedCrossesYear">{sex}</span>
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem onClick={()=>setSex("Female")}>Female</DropdownItem>
                                        <DropdownItem onClick={() =>setSex("Male")}>Male</DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
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

FilterOptions.propTypes = {
    applyFilterCallback: PropTypes.func.isRequired,
    matchWidthElementId: PropTypes.string.isRequired
}