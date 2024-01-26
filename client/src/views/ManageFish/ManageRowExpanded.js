import PropTypes from "prop-types";
import {Button} from "reactstrap";
import React from "react";

export default function ManageRowExpanded({fishId}) {

    const handleCrossFishClick = () => {
        console.info("Request to cross: " + fishId)
    }

    return (
        <tr className='expanded-row-contents'>
            <td>
                <Button className="btn cross-btn" color="default" type="button" onClick={handleCrossFishClick}>
                    Cross
                </Button>
            </td>
        </tr>
    );
}

ManageRowExpanded.propTypes = {
    fishId: PropTypes.string.isRequired
}