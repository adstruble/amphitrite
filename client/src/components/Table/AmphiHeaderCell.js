
export default function AmphiHeaderCell({header, updateOrderBy}) {
    return(
        <th>
            <div>
                // TODO handle if no order_by
                <div style="float: right; line-height: 10px;">
                    <i onClick={updateOrderBy(header.order_by)} className="tim-icons  icon-minimal-up " style={{display:'block', fontSize:'9px', paddingRight:'5px'}} aria-hidden="true"/>
                    <i onClick={updateOrderBy(header.order_by)} className="tim-icons  icon-minimal-down" style={{display:'block', fontSize:'9px', paddingRight:'5px'}} aria-hidden="true"/>
                </div>
                <span>{header.name}</span>
            </div>
        </th>
    );
}
