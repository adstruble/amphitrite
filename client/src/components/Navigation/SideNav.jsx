import {Nav, NavItem, NavLink} from "reactstrap";
import classnames from "classnames";
import React, {useEffect, useState} from "react";

export default function SideNav(destinations){
    const [activePill, setActivePill] = useState(1);

    return (
        <Nav className="nav-pills-info nav-pills-icons" pills>
            <NavItem>
                <NavLink
                    className={classnames({
                        "active show": activePill === 1
                    })}
                    onClick={(e) => setActivePill(2)}
                    href="#pablo"
                >
                    <i className="tim-icons icon-atom" />
                    Home
                </NavLink>
            </NavItem>
        </Nav>
    );
}