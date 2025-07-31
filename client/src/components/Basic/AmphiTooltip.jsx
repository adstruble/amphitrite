import React from "react";
import {Tooltip, UncontrolledTooltip} from "reactstrap";


export default function AmphiTooltip({content, target}){

    return (
        <UncontrolledTooltip
            placement={"top-start"}
            target={target}
            transition={{ timeout: 0 }}  fade={false}>
            {content}
        </UncontrolledTooltip>
    );


}
