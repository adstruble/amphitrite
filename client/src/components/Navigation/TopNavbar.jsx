import React from "react";
import { useNavigate, Link, NavLink, useLocation } from "react-router-dom";

import {
    Navbar,
    Container, NavbarBrand, Button, Nav, NavItem, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem
} from "reactstrap";

import Logout from "../../assets/img/box-arrow-right.svg";
import App from "../../App";
import ReactDOM from "react-dom/client";

const VIEW_NAMES = {
    '/managefish': 'Fish',
    '/crossfish': 'Recommend Crosses',
    '/viewcrosses': 'Completed Crosses',
    '/fishcare': 'Fish Care',
    '/usersettings': 'User Settings',
    '/manageusers': 'Manage Users',
    '/': 'Fish',
};

export default function TopNavbar() {
    const [color, setColor] = React.useState("bg-info");
    const navigate = useNavigate();
    const location = useLocation();
    const viewName = VIEW_NAMES[location.pathname] ?? '';

    const handleLogoutClick = async e => {
        e.preventDefault();
        sessionStorage.removeItem('token');
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
            <React.StrictMode>
                <App/>
            </React.StrictMode>
        );
    }

    return (
    <Navbar className={"fixed-top " + color} color-on-scroll="100" expand="lg">
        <Container style={{position: 'relative'}}>
            <div className="navbar-translate">
                <Nav navbar>
                    <NavItem>
                        <NavLink tag={Link} to="/managefish">
                            <span className="nav-link">Fish</span>
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <UncontrolledDropdown>
                            <DropdownToggle
                                aria-expanded={false}
                                aria-haspopup={true}
                                caret
                                color="default"
                                data-toggle="dropdown"
                                id="crossesDropdownMenuLink"
                                nav
                            >
                                <span >Crosses</span>
                            </DropdownToggle>
                            <DropdownMenu aria-labelledby="navbarDropdownMenuLink">
                                <DropdownItem
                                    tag={Link} to="/crossfish"
                                >
                                    Recommend Crosses
                                </DropdownItem>
                                <DropdownItem
                                    tag={Link} to="/viewcrosses"
                                >
                                    Completed Crosses
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to="/manageusers">
                            <span className="nav-link">Reports</span>
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to="/manageusers">
                            <span className="nav-link">Users</span>
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>
            <span style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                pointerEvents: 'none',
            }}>
                {viewName}
            </span>

            <Nav>

                <NavItem>
                    <NavLink tag={Link} to="/usersettings">
                        <i className="tim-icons icon-settings-gear-63"/>
                    </NavLink>
                </NavItem>
                <NavItem>
                    <Button className="nav-link d-none d-lg-block"
                            color="default"
                            onClick={handleLogoutClick}>
                        <div className="logout">
                            <img alt="logout" src={Logout} className="amphi-icon"/>
                            <span>Sign Out</span>
                        </div>
                    </Button>
                </NavItem>

            </Nav>
        </Container>
    </Navbar>
    );

}
