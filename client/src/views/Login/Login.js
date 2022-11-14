import React from "react";
import {
    Container,
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

export default class Login extends React.Component{


    constructor(props) {
        super(props);
        this.state = {
            nameFocus: false
        }
    }

    render(){
        return (<div className="content">
            <Container>
                <Row>
                    <Col className="offset-lg-0 offset-md-3" lg="5" md="6">
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
                                            "input-group-focus": this.state.nameFocus
                                        })}
                                    >
                                        <Button addonType="prepend">
                                            <InputGroupText>
                                                <i className="tim-icons icon-single-02" />
                                            </InputGroupText>
                                        </Button>
                                        <Input
                                            placeholder="Name"
                                            type="text"
                                            onFocus={() => this.setState({"nameFocus": true})}
                                            onBlur={() => this.setState({"nameFocus": true})}
                                        />
                                    </InputGroup>
                                    {/*<InputGroup
                                        className={classnames({
                                            "input-group-focus": passwordFocus
                                        })}
                                    >
                                        <Button addonType="prepend">
                                            <InputGroupText>
                                                <i className="tim-icons icon-lock-circle" />
                                            </InputGroupText>
                                        </Button>
                                        <Input
                                            placeholder="Password"
                                            type="text"
                                            onFocus={(e) => setPasswordFocus(true)}
                                            onBlur={(e) => setPasswordFocus(false)}
                                        />
                                    </InputGroup>*/}
                                </Form>
                            </CardBody>
                            <CardFooter>
                                <Button className="btn-round" color="primary" size="lg">
                                    Breed Fish
                                </Button>
                            </CardFooter>
                        </Card>

                    </Col>
                </Row>
            </Container>
        </div>);
    }
}