import {Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import * as PropTypes from "prop-types";
import React, {useState} from "react";
import {range} from "../Utils/General";

export function CrossYearDropdown({yearSelectedCallback, includeAllYears=false}) {

    const [crossYearDropdownOpen, setCrossYearDropdownOpen] = useState(false);
    const currentYear = new Date().getFullYear();
    const years = range(currentYear, 2007);
    const [dropdownSelection, setDropdownSelection] = useState(includeAllYears ? 'All' : currentYear)

    function toggleDropdown(){
        setCrossYearDropdownOpen((prevState) => !prevState);
    }

    return <Dropdown label={dropdownSelection} toggle={toggleDropdown}
                     isOpen={crossYearDropdownOpen}>
        <DropdownToggle style={{paddingTop: 0, paddingLeft: 0}}
                        aria-expanded={false}
                        aria-haspopup={true}
                        caret
                        color="default"
                        data-toggle="dropdown"
                        id="crossesDropdownMenuLink"
                        nav
        >
            <span id="completedCrossesYear">{dropdownSelection}</span>
        </DropdownToggle>
        <DropdownMenu aria-labelledby="navbarDropdownMenuLink">
            {includeAllYears && <DropdownItem onClick={() => yearSelectedCallback('All')}>
                All
            </DropdownItem>}
            {years.map((year) => {
                    return(<DropdownItem onClick={() => {
                        setDropdownSelection(year);
                        yearSelectedCallback(year)}}>
                        {year}
                    </DropdownItem>)
                })}
        </DropdownMenu>
    </Dropdown>;
}

CrossYearDropdown.propTypes = {
    yearSelectedCallback: PropTypes.func.isRequired,
    includeAllYears: PropTypes.bool
};