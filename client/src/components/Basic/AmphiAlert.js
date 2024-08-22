import {Alert} from "reactstrap";
import React from "react";


export default function AmphiAlert({alertText, alertLevel, setAlertText}){

    return (<Alert isOpen={alertText.length > 0} color={alertLevel} fade={true} toggle={() => setAlertText("")}>
        <div>{alertLevel === "danger" && <strong>Error: </strong>} {alertText}</div>
    </Alert>);


}

