import React from "react";
import {Button} from "reactstrap";
import classnames from "classnames";

export function CrossFishExport({callback}){
    return(<Button className="nav-link" color="default" type="button" onClick={callback}>
        <div className="logout">
            <i className={classnames("amphi-icon", "icon-download")}/>
            <span>Export Selected Crosses</span>
        </div>
    </Button>);
}