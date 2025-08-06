import React from "react";
import { useNavigate, Link, NavLink } from "react-router-dom";

import {
    Navbar,
    Container, NavbarBrand, Button, Nav, NavItem, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem
} from "reactstrap";

import Logout from "../../assets/img/box-arrow-right.svg";
import App from "../../App";
import ReactDOM from "react-dom/client";

export default function TopNavbar() {
    const [color, setColor] = React.useState("bg-info");
    const navigate = useNavigate();

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
        <Container>
            <div className="navbar-translate">
                <Nav navbar>
                    <NavItem>
                        <NavLink tag={Link} to="/managefish">
                            <span className="nav-link">Manage Fish</span>
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
                                <span >Manage Crosses</span>
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
                            <span className="nav-link">Manage Users</span>
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>
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
