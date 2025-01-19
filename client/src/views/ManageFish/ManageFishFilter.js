import {
    Button,
    Col,
    Dropdown, DropdownItem,
    DropdownMenu,
    DropdownToggle, FormGroup,
    Input, Label,
    Row
} from "reactstrap";
import PropTypes from "prop-types";
import React, {useState} from "react";
import {CrossYearDropdown} from "../../components/Basic/CrossYearDropdown";
import classnames from "classnames";

export function ManageFishFilter({setFilterParent}) {
    const [year, setYear] = useState('2024');
    const [sex, setSex] = useState('Both');
    const [sexDropdownOpen, setSexDropdownOpen] = useState(false);
    const [aliveYes, setAliveYes] = useState(true);
    const [aliveNo, setAliveNo] = useState(false);
    const [yesAliveDisabled, setYesAliveDisabled] = useState(true);
    const [noAliveDisabled, setNoAliveDisabled] = useState(false);
    const [groupId, setGroupId] = useState("");
    const [initLoad, setInitLoad] = useState(true);


    function toggleSexDropdown(){
        setSexDropdownOpen((prevState) => !prevState);
    }


    React.useEffect(()=>{
        let filterState = {}
        if (year !== 'All'){
            filterState['cross_year'] = year
        }
        if (sex !== 'Both'){
            filterState['sex'] = sex[0].toUpperCase()
        }
        if (groupId !== ""){
            filterState['group_id'] = groupId;
        }
        if (!(aliveYes && aliveNo)){
            filterState['alive'] = aliveYes
        }
        setFilterParent(filterState, initLoad);
        setInitLoad(false);
    }, [groupId, aliveYes, aliveNo, sex, year, initLoad]);


    return (
        <div className="input-area">
            <Row>
                <Col>
                    <span>Year parents were crossed:</span>
                </Col>
                <Col>
                    <CrossYearDropdown includeThisYear={false}
                                       yearSelectedCallback={setYear}
                                       includeAllYears={true}
                                       startSelection={new Date().getFullYear() - 1}
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>Family ID:</span>
                </Col>
                <Col>
                    <Input id="groupId" style={{width:"auto"}} onChange={(e)=>{
                        setGroupId(e.target.value);
                    }}/>
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
                            <span id="sexSelection">{sex}</span>
                        </DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem onClick={()=>{setSex("Both")}}>Both</DropdownItem>
                            <DropdownItem onClick={()=>{setSex("Female")}}>Female</DropdownItem>
                            <DropdownItem onClick={() =>{setSex("Male")}}>Male</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </Col>
            </Row>
            <Row>
                <Col>
                    <span>Alive:</span>
                </Col>
                <Col>
                    <FormGroup check>
                        <Label check style={{marginRight: '10px'}}>
                            <Input disabled={yesAliveDisabled} defaultChecked={aliveYes} type="checkbox"
                                   onChange={(e) => {
                                           setAliveYes(e.target.checked);
                                           setNoAliveDisabled(!e.target.checked);
                                   }}
                                   id="yesAliveCheck"
                            />
                            <span className={classnames("form-check-sign")}>Yes</span>
                        </Label>
                    <Label check>
                        <Input defaultChecked={aliveNo} type="checkbox" disabled={noAliveDisabled}
                               onChange={(e) => {
                                       setAliveNo(e.target.checked);
                                       setYesAliveDisabled(!e.target.checked);
                               }}
                               id="noAliveCheck"
                        />
                        <span className={classnames("form-check-sign")}>No</span>
                    </Label>
                </FormGroup>
                </Col>
            </Row>
        </div>
    )
}

ManageFishFilter.propTypes = {
    setFilterParent: PropTypes.func.isRequired
}