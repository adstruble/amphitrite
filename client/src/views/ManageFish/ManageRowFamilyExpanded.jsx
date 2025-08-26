import PropTypes from "prop-types";
import React from "react";
import PedigreeTree from "../../components/Charts/PedigreeTree.js";


export default function ManageRowFamilyExpanded({fish, setAlertLevel, setAlertText}) {
    return (
        <tr className='expanded-row-contents'>
            <td>
                <div>
                    <PedigreeTree fish={fish} setAlertLevel={setAlertLevel} setAlertText={setAlertText}/>
                </div>
            </td>
        </tr>
    );
}

ManageRowFamilyExpanded.propTypes = {
    fish: PropTypes.object.isRequired
}