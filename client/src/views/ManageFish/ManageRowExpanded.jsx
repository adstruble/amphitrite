import PropTypes from "prop-types";
import {Input} from "reactstrap";
import React from "react";
import {onKeyupWithDelay} from "../../components/Utils/General";

export default function ManageRowExpanded({fish, saveNotes}) {
    return (
        <tr className='expanded-row-contents'>
            <td>
                <div>
                    <span>Notes</span>
                </div>
                <div>
                    <Input type="textarea"
                           defaultValue={fish['notes']}
                           className="form-control"
                           id="fishNotesArea" rows="2"
                           onKeyUp={onKeyupWithDelay((e) => saveNotes(e.target.value, fish),500)}/>
                </div>
            </td>
        </tr>
    );
}

ManageRowExpanded.propTypes = {
    fish: PropTypes.object.isRequired,
    saveNotes: PropTypes.func.isRequired
}