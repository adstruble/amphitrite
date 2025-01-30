import {Col, FormGroup, Input, Label} from "reactstrap";
import React from "react";
import PropTypes from "prop-types";
import {ConditionalWrapper} from "../Utils/General";

export default function RadioGroup({items, radioSelectedCallback, selectedItem, sideBySide}) {
    return(
        items.map(item_name => {
                return(
                    <ConditionalWrapper
                        condition={sideBySide}
                        wrapper={children => <Col style={{paddingLeft:0}}>{children}</Col>}
                    >
                        <FormGroup check className="form-check-radio">
                            <Label check>
                                <Input
                                    defaultChecked={item_name === selectedItem}
                                    id={item_name +"_radio"}
                                    name="fishRadios"
                                    type="radio"
                                    onClick={() =>radioSelectedCallback(item_name)}
                                />
                                <span className="form-check-sign" />
                                {item_name}
                            </Label>
                        </FormGroup>
                    </ConditionalWrapper>
                );
            })
    )
}
RadioGroup.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    radioSelectedCallback: PropTypes.func
}