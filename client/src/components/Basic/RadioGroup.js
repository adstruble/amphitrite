import {FormGroup, Input, Label} from "reactstrap";
import React from "react";
import PropTypes from "prop-types";

export default function RadioGroup({items, radioSelectedCallback, selectedItem}) {
    return(
        items.map((item_name) => {
                return(<FormGroup check className="form-check-radio">
                    <Label check>
                        <Input
                            checked={item_name === selectedItem}
                            defaultValue={item_name}
                            id={item_name +"_radio"}
                            name="fishRadios"
                            type="radio"
                            onClick={() =>radioSelectedCallback(item_name)}
                        />
                        <span className="form-check-sign" />
                        {item_name}
                    </Label>
                </FormGroup>);
            })


    )
}
RadioGroup.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    radioSelectedCallback: PropTypes.func
}