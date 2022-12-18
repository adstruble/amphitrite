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
    Input, CardFooter, Button
} from "reactstrap";

import classnames from "classnames";
    import PropTypes from "prop-types";

async function loginUser(credentials) {
    return fetch('/amphitrite/login',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    })
        .then(data => data.json())
}

export default function Login({setToken, squares7and8}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nameFocus, setNameFocus] = useState(false);
    const [passwordFocus, setPasswordFocus] = useState(false);

    const handleBreedClick = async e => {
        e.preventDefault();
        const token = await loginUser({
            username,
            password
        });
        setToken(token);
    }

    return (
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
                                        placeholder="Name"
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
                                            <i className="tim-icons icon-lock-circle" />
                                        </InputGroupText>
                                    </div>
                                    <Input
                                        placeholder="Password"
                                        type="text"
                                        onFocus={() => setPasswordFocus(true)}
                                        onBlur={() => setPasswordFocus(false)}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </InputGroup>
                            </Form>
                        </CardBody>
                        <CardFooter>
                            <Button className="btn-round" color="primary" size="lg" onclick={handleBreedClick}>
                                Breed Fish
                            </Button>
                        </CardFooter>
                    </Card>

                </Col>
            </Row>
    );
}
Login.propTypes = {
    setToken: PropTypes.func.isRequired,
    squares7and8: PropTypes.string.isRequired
};