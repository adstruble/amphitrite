import classNames from "classnames";
import {Button, Col, Container, FormGroup, Input, InputGroup, InputGroupText, Row, UncontrolledAlert} from "reactstrap";
import classnames from "classnames";
import React, {useState} from "react";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";


export default function UserSettings(){
    const [password, setPassword] = useState('');
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState("");
    const [passwordInputType, setPasswordInputType] = React.useState("password");
    const {getUsername} = useToken();

    function savePassword(){
        fetchData("users/save_password", getUsername(),
            {password: password}, () => {
                setAlertText("Password changed");
                setAlertLevel("success");
                setPasswordInputType("password")
        });
    }

    return(
        <div className={classNames("wrapper")}>
            <Container>
                <Row>
                    <UncontrolledAlert className="alert-with-icon" isOpen={alertText.length > 0} color={alertLevel}>
                        {alertLevel === "danger" && <strong>Error: </strong>} {alertText}
                    </UncontrolledAlert>
                </Row>
                <h1>User Settings</h1>
                <Row>
                    <Col xs="3">
                <h2>Change Password</h2>
                <FormGroup className={classnames({
                    "input-group-focus": passwordFocus
                })}>
                    <label>New Password</label>
                    <InputGroup>
                        <Input
                            type={passwordInputType}
                            onFocus={() => setPasswordFocus(true)}
                            onBlur={() => setPasswordFocus(false)}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <div className="input-group-append">
                            <InputGroupText>
                                <i className={classnames('input-group-append', 'tim-icons',
                                    passwordInputType === 'password' ? 'icon-hide' : 'icon-view')}
                                   style={{paddingLeft: '5px'}}
                                   onClick={() => setPasswordInputType(
                                       passwordInputType === 'password' ? 'text' : 'password')}/>
                            </InputGroupText>
                        </div>
                    </InputGroup>
                </FormGroup>
                        <Button onClick={savePassword}>
                            Save Password
                        </Button>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}