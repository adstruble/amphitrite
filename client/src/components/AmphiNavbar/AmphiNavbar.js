import React from "react";

import {
    Navbar,
    Container, NavbarBrand, Button, Nav, NavItem
} from "reactstrap";

import Logout from "../../assets/img/box-arrow-right.svg";

export default function AmphiNavbar({setToken}) {
    const [color, setColor] = React.useState("bg-info");

    const handleLogoutClick = async e => {
        e.preventDefault();
        setToken(null);
    }

    return (
    <Navbar className={"fixed-top " + color} color-on-scroll="100" expand="lg">
        <Container>
            <div className="navbar-translate">
                <NavbarBrand to="/" id="navbar-brand">
                    Amphitrite
                </NavbarBrand>
            </div>
            <Nav navbar>
                <NavItem>
                    <Button className="nav-link d-none d-lg-block"
                            color="default"
                            onClick={handleLogoutClick}>
                        <div className="logout">
                            <img src={Logout} className="logout"/>
                            <span>Sign Out</span>
                        </div>
                    </Button>
                </NavItem>
            </Nav>
        </Container>
    </Navbar>
    );

}
