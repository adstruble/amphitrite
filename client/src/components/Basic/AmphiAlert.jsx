import {Alert} from "reactstrap";
import React from "react";


export default function AmphiAlert({alertText, alertLevel, setAlertText}){

    const setAlertTextFunc = () =>{
        setAlertText("")
    }

    return (<Alert isOpen={alertText.length > 0} color={alertLevel} toggle={setAlertText && setAlertTextFunc}>
        <div>{alertLevel === "danger" && <strong>Error: </strong>} {alertText}</div>
    </Alert>);


}

