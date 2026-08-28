import React, {useEffect, useState} from "react";
import {Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Input, Row} from "reactstrap";
import PropTypes from "prop-types";
import useSpeciesConfig from "../../components/App/useSpeciesConfig";

export function FishCareFilter({setFilterParent}) {
    // Facilities come from the species config (GET /common/config), not hardcoded.
    const speciesConfig = useSpeciesConfig();
    const facilities = ['All', ...((speciesConfig && speciesConfig.fish_care_facilities) || [])];

    const [facility, setFacility] = useState('All');
    const [facilityOpen, setFacilityOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [minMorts, setMinMorts] = useState('');
    const [initLoad, setInitLoad] = useState(true);

    useEffect(() => {
        const filterState = {};
        if (facility !== 'All') filterState.facility = facility;
        if (dateFrom) filterState.date_from = dateFrom;
        if (dateTo) filterState.date_to = dateTo;
        if (minMorts !== '') filterState.min_morts = minMorts;
        // initLoad=true forces the first (empty) filter to apply so the table loads on mount.
        setFilterParent(filterState, initLoad);
        setInitLoad(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facility, dateFrom, dateTo, minMorts]);

    return (
        <div className="input-area">
            <Row>
                <Col><span>Facility:</span></Col>
                <Col>
                    <Dropdown isOpen={facilityOpen} toggle={() => setFacilityOpen(o => !o)}>
                        <DropdownToggle style={{paddingTop: 0, paddingLeft: 0}} caret color="default" nav>
                            <span>{facility}</span>
                        </DropdownToggle>
                        <DropdownMenu>
                            {facilities.map(f => (
                                <DropdownItem key={f} onClick={() => setFacility(f)}>{f}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </Col>
            </Row>
            <Row>
                <Col><span>Date from:</span></Col>
                <Col>
                    <Input type="date" bsSize="sm" value={dateFrom}
                           onChange={e => setDateFrom(e.target.value)}/>
                </Col>
            </Row>
            <Row>
                <Col><span>Date to:</span></Col>
                <Col>
                    <Input type="date" bsSize="sm" value={dateTo}
                           onChange={e => setDateTo(e.target.value)}/>
                </Col>
            </Row>
            <Row>
                <Col><span>Min morts:</span></Col>
                <Col>
                    <Input type="number" bsSize="sm" min="0" style={{width: 'auto'}} value={minMorts}
                           onChange={e => setMinMorts(e.target.value)}/>
                </Col>
            </Row>
        </div>
    );
}

FishCareFilter.propTypes = {
    setFilterParent: PropTypes.func.isRequired,
};
