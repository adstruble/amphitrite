import React, {useState} from "react";
import {
    Row,
    Col,
    Card,
    CardHeader,
    CardImg,
    CardTitle,
    CardBody,
    Form,
    InputGroup,
    InputGroupText,
    Input, CardFooter, Button, Container
} from "reactstrap";

import classnames from "classnames";
import PropTypes from "prop-types";
import Squares from "../../components/Styles/Squares";

async function loginUser(credentials) {

    return fetch('/amphitrite/login',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    }).then(data => data.json())
}

export default function Login({setToken}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nameFocus, setNameFocus] = useState(false);
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [squares7and8, setSquares7and8] = React.useState("");
    const [passwordInputType, setPasswordInputType] = React.useState("password");

    const handleBreedClick = async e => {
        e.preventDefault();
        const token = await loginUser({
            username,
            password
        });
        setToken(token);
    }

    return (
        <div className="wrapper">
            <div className="page-header">
                <div className="page-header-image"/>
                <div className="content">
                    <Container>
                        <Row>
                            <Col className="offset-lg-0 offset-md-3" lg="5" md="6">
                                <div
                                    className="square square-7"
                                    id="square7"
                                    style={{ transform: squares7and8 }}
                                />
                                <div
                                    className="square square-8"
                                    id="square8"
                                    style={{ transform: squares7and8 }}
                                />
                                <Card className="card-register">
                                    <CardHeader>
                                        <CardImg
                                            alt="..."
                                            src={require("../../assets/img/square-purple-1.png")}
                                        />
                                        <CardTitle tag="h4">Login</CardTitle>
                                    </CardHeader>
                                    <CardBody>
                                        <Form className="form">
                                            <InputGroup
                                                className={classnames({
                                                    "input-group-focus": nameFocus
                                                })}
                                            >
                                                <div className="input-group-prepend">
                                                    <InputGroupText>
                                                        <i className="tim-icons icon-single-02" />
                                                    </InputGroupText>
                                                </div>
                                                <Input
                                                    id="amphi-username"
                                                    placeholder="Username"
                                                    type="text"
                                                    onFocus={() => setNameFocus(true)}
                                                    onBlur={() => setNameFocus(false)}
                                                    onChange={e => setUsername(e.target.value)}
                                                />
                                            </InputGroup>
                                            <InputGroup
                                                className={classnames({
                                                    "input-group-focus": passwordFocus
                                                })}
                                            >
                                                <div className="input-group-prepend">
                                                    <InputGroupText>
                                                        <i className="tim-icons icon-lock-circle"/>
                                                    </InputGroupText>
                                                </div>
                                                <Input
                                                    id="amphi-password"
                                                    placeholder="Password"
                                                    type={passwordInputType}
                                                    onFocus={() => setPasswordFocus(true)}
                                                    onBlur={() => setPasswordFocus(false)}
                                                    onChange={e => setPassword(e.target.value)}
                                                />

                                                <div className="input-group-append">
                                                    <InputGroupText>
                                                        <i className={classnames('input-group-append', 'tim-icons',
                                                            passwordInputType === 'password' ? 'icon-hide' : 'icon-view')}
                                                           style={{paddingLeft:'5px'}}
                                                           onClick={() => setPasswordInputType(
                                                               passwordInputType === 'password' ? 'text' : 'password')}/>
                                                    </InputGroupText>
                                                </div>
                                            </InputGroup>
                                        </Form>
                                    </CardBody>
                                    <CardFooter>
                                        <Button className="btn-round" color="primary" size="lg" onClick={handleBreedClick}>
                                            Breed Fish
                                        </Button>
                                    </CardFooter>
                                </Card>

                            </Col>
                        </Row>
                    </Container>
                    <div className="register-bg"/>
                    <Squares classToggle="register-page" setSquares7and8={setSquares7and8}/>
                </div>
            </div>
        </div>
    );
}
Login.propTypes = {
    setToken: PropTypes.func.isRequired
};