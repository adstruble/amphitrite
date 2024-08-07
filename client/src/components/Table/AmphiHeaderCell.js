import PropTypes from "prop-types";

export default function AmphiHeaderCell({header, updateOrderBy}) {
    const showOrderedDesc = header. order_direction ? header.order_direction === "DESC" : header.order_by != null;
    const showOrderedAsc = header.order_direction ? header.order_direction === "ASC" : header.order_by != null;

    const updateOrderByHeader = () => {
        updateOrderBy(header);
    };

    return(
        <th role="columnheader" className="th"> {/* I don't know why class of th is necessary, but layout doesn't work properly without it*/}
            <div>
                <div style={{float: 'right', lineHeight: '10px'}}>
                    <i onClick={updateOrderByHeader}
                       className="tim-icons  icon-minimal-up order-by"
                       style={{display: showOrderedAsc ? 'block' : 'none', cursor: showOrderedAsc ? 'pointer' : 'inherit' }}
                       aria-hidden="true"/>
                    <i onClick={updateOrderByHeader}
                       className="tim-icons  icon-minimal-down order-by"
                       style={{display: showOrderedDesc ? 'block' : 'none', cursor: showOrderedDesc ? 'pointer' : 'inherit'}}
                       aria-hidden="true"/>
                </div>
                <span>{header.name}</span>
            </div>
        </th>
    );
}
AmphiHeaderCell.propTypes = {
    header: PropTypes.any.isRequired,
    updateOrderBy: PropTypes.func
}