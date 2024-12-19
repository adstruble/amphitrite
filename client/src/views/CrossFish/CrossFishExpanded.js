import PropTypes from "prop-types";
import AmphiTable from "../../components/Table/AmphiTable";
import {
    formatDate,
    formatDoubleTo3,
    formatStr
} from "../../components/Utils/FormatFunctions";

export default function CrossFishExpanded({item}) {
    const familyCrossURL = "cross_fish/get_completed_crosses_by_family"
    const CROSSES_HEADER = {
        rows:{},
        cols:[
            {name: "Date Cross Made", key:"cross_date", visible: true, format_fn: formatDate, width:".9fr"},
            {name: "F", key: "f", visible: true, format_fn: formatDoubleTo3, width:"1fr"},
            {name: "DI", key: "di", visible: true, format_fn: formatDoubleTo3, width:".7fr"},
            {name: "F Fish", key: "f_tag", visible: true, format_fn: formatStr, width:".9fr", tooltip: true},
            {name: "F PC/FSG", key: "x_gid",  visible: true, format_fn: formatStr, width:".9fr"},
            {name: "M Fish", key: "m_tag", visible: true, format_fn: formatStr, width:".9fr", tooltip: true},
            {name: "M PC/FSG", key: "y_gid",  visible: true, format_fn: formatStr, width:".9fr"}
        ]};

    function getRowContents(){
        if(item['x_crosses'] + item['y_crosses'] === 0){
            return <><span>No other crosses have been made with either group {item['x_gid']} of year {item['x_cross_year']} or group {item['y_gid']} of year {item['y_cross_year']}</span></>
        }

        if (item['x_crosses'] > 0 && item['y_crosses'] === 0) {
            return (
                <div className="inner-amphi-table">
                    <h6>Refuge Crosses Made With Family Sibling Group {item['x_gid']} of Year {item['x_cross_year']}</h6>
                    <AmphiTable headerDataStart={CROSSES_HEADER}
                                fetchParams={{fam_id: item['p1_fam_id']}}
                                tableDataUrl={familyCrossURL}
                                includePagination={false}
                                includeSearch={false}/>
                </div>);
        }

        if (item['y_crosses'] > 0 && item['x_crosses'] === 0){
            return (
                <div className="inner-amphi-table">
                    <h6>Refuge Crosses Made With Family Sibling Group {item['y_gid']} of Year {item['y_cross_year']}</h6>
                    <AmphiTable headerDataStart={CROSSES_HEADER}
                        fetchParams={{fam_id: item['p2_fam_id']}}
                        tableDataUrl={familyCrossURL}
                        includePagination={false}
                        includeSearch={false}/>
                </div>);
        }

        return (
            <div className="inner-amphi-table">
                <h6>Refuge Crosses Made With Family Sibling Group {item['x_gid']} of Year {item['x_cross_year']}</h6>
                <AmphiTable headerDataStart={CROSSES_HEADER}
                            fetchParams={{fam_id: item['p1_fam_id']}}
                            tableDataUrl={familyCrossURL}
                            includePagination={false}
                            includeSearch={false}/>
                <h6 style={{paddingTop:10}}>Refuge Crosses Made With Family Sibling Group {item['y_gid']} of Year {item['y_cross_year']}</h6>
                <AmphiTable headerDataStart={CROSSES_HEADER}
                            fetchParams={{fam_id: item['p2_fam_id']}}
                            tableDataUrl={familyCrossURL}
                            includePagination={false}
                            includeSearch={false}/>
            </div>

        )
    }

    return (
        <tr className='expanded-row-contents'>
        <td>
                {getRowContents()}
            </td>
        </tr>
    );
}

CrossFishExpanded.propTypes = {
    item: PropTypes.any.isRequired
}