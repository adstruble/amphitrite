import {Cell} from "@table-library/react-table-library/table";
import {useState} from "react";
import PropTypes from "prop-types";

export default function AmphiCell(cellValue, id_key){
    return(
        <Cell id={id_key} key={id_key}>{cellValue}</Cell>
    );
}

AmphiCell.propTypes = {
    cellValueStart: PropTypes.string.isRequired,
    id_key: PropTypes.string.isRequired
}