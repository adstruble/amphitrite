import PropTypes from "prop-types";
import classnames from "classnames";
import React from "react";
import AmphiTooltip from "../Basic/AmphiTooltip.jsx";

export default function AmphiHeaderCell({header, updateOrderBy}) {
    const showOrderedDesc = header. order_direction ? header.order_direction === "DESC" : header.order_by != null;
    const showOrderedAsc = header.order_direction ? header.order_direction === "ASC" : header.order_by != null;

    const updateOrderByHeader = () => {
        updateOrderBy(header);
    };

    return(
        <th role="columnheader" className={classnames("th",header.className && header.className)}> {/* I don't know why class of th is necessary, but layout doesn't work properly without it*/}
            <div style={{height:"100%"}}>
                <div style={{float: 'right', lineHeight: '10px', height:"100%"}}>
                    <i onClick={updateOrderByHeader}
                       className="tim-icons  icon-minimal-up order-by"
                       style={{display: showOrderedAsc ? 'block' : 'none', cursor: showOrderedAsc ? 'pointer' : 'inherit' }}
                       aria-hidden="true"/>
                    <i onClick={updateOrderByHeader}
                       className="tim-icons  icon-minimal-down order-by"
                       style={{display: showOrderedDesc ? 'block' : 'none', cursor: showOrderedDesc ? 'pointer' : 'inherit'}}
                       aria-hidden="true"/>
                </div>
                <span id={"header" + header.key}>{header.name}</span>
                {header.header_tooltip && <AmphiTooltip
                    placement={"top-start"}
                    target={"header" + header.key}>
                    {header.header_tooltip}
                </AmphiTooltip>}
            </div>
        </th>
    );
}
AmphiHeaderCell.propTypes = {
    header: PropTypes.any.isRequired,
    updateOrderBy: PropTypes.func
}