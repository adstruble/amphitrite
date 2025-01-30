import {FormGroup, Input, Label, UncontrolledTooltip} from "reactstrap";
import classnames from "classnames";
import React from "react";

export const formatDate = (date) => {
    date = new Date(date);
    date.setTime( date.getTime() + date.getTimezoneOffset()*60*1000 );
    if (date.getUTCMonth() === 0 && date.getUTCDate() === 1){
        // Assume the month and day aren't actually known so only report year
        return date.getUTCFullYear().toString();
    }
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })

}

export const formatStr = (str) => {
    return str
}

export const formatArrayToStr = (array) => {
    return array.join(", ");
}

export const formatIcon = (val, item, format_args) => {
    // Use format_args[1] if val is True, otherwise use format_args[2]
    return (<i className={classnames('icon', 'tim-icons', val ? format_args[1] : format_args[2], 'amphi-cell',
            format_args.length > 3 ? format_args[3](item) : '')}
               onClick={format_args[0]}/>
    );
}

export const formatDelete = (_, item, format_args) => {
    const deleteFn = format_args[0];
    const disabled = format_args[1](item);
    return (<Label className={classnames('has-danger', 'amphi-cell', disabled ? 'disabled' : '')}
                   onClick={() =>deleteFn(item)}/>
    );
}

export const formatCheckbox = (checked, item, format_args) => {
    let rowCheckedCallback = format_args[0]
    let selected = format_args[1](item);
    let disabled = false;
    if (format_args.length > 2) {
        disabled = format_args[2](item)
        disabled = format_args[2](item)
    }
    return (<FormGroup check disabled={disabled} className={classnames("no-label", "form-check-table")}>
        <Label check>
            <Input defaultChecked={selected} type="checkbox"
                   onChange={(e) => rowCheckedCallback(e, item)}
                            id={item['id'] + rowCheckedCallback(null, null, true)}
                    />
                    <span className={classnames("form-check-sign", "form-check-sign-table")} />
                </Label>
            </FormGroup>);
}

export function formatTextWithIcon (txt, item, format_args, handleExpand, colName){
    // First format_arg is the icon class,
    // 2nd format_arg is True if clicking the icon should expand the row.
    // 3rd format_arg is tooltip for icon
    // 4th format_arg is True if tooltip for text should be included
    function onIconClick(event) {
        if (format_args[1]){
            handleExpand(item, event);
        }
    }

    const textTooltipId = 'id' + item['id'] + colName + 'span';
    const iconTooltipId = 'id' + item['id'] + colName + 'i';
    return (<div style={{overflowX:"hidden", textOverflow:"ellipsis"}}>
                <i id={iconTooltipId}
                    onClick={onIconClick}
                    className={classnames("tim-icons", format_args[0], "amphi-cell", "clickable", "icon")}
                    color="info"/>
                {format_args[2] && <UncontrolledTooltip
                        placement={"top-start"}
                        target={iconTooltipId}>
                        {format_args[2]}
                </UncontrolledTooltip>}
                <span id={textTooltipId}>{txt}</span>
                {format_args[3] && txt && <UncontrolledTooltip
                    target={textTooltipId}
                    placement={"top-start"}
                >{txt}
                </UncontrolledTooltip>}
    </div>);
}

export const formatDoubleTo3 = (dbl) =>{
    return formatDoubleToN(dbl, 3)
}

const formatDoubleToN = (dbl, n) =>{
    if (dbl == 0){
        return dbl;
    }
    let multipliers = 0;
    let negative = false;
    if (dbl < 0){
        negative = true;
        dbl = -1 * dbl;
    }
    while (dbl < 10**(n-1)){
        dbl  = dbl * 10;
        multipliers = multipliers + 1;
    }
    dbl = Math.round(dbl);
    dbl = dbl / 10**multipliers;
    if (negative){
        dbl = dbl * -1;
    }
    return dbl;
}

// Highlight the tag that was used in the completed cross if there was one.
export const formatArrayToStrTags = (tags, requested_cross, m_f) => {
    if (tags == null){
        return "";
    }
    // Super hacky, but _sup or _ref is encoded into the completed tag so that we know if it came
    // from supp or refuge family
    let requested_cross_tag = "";
    if (requested_cross['completed' + m_f] !=  null){
        requested_cross_tag = requested_cross['completed' + m_f].slice(0, -4);
    }
    tags.sort(function (a, b){return sort_by_completed(a, b, requested_cross_tag)});
    if (tags[tags.length -1] === null){
        tags.pop();
    }

    if (requested_cross_tag !== ""){

        if (tags.length === 1 && requested_cross_tag !== tags[0]){
            return (<div><span className='text-muted'>{tags[0]} </span><span className='text-primary'>({requested_cross_tag})</span></div>);
        }else if(tags.length === 0) {
            return (<span className='text-primary'>{requested_cross_tag}</span>);
        }
        let tag_array = (tags.map((tag, index) => {
            let comma = index < tags.length - 1 ? ", " : ""
                if (tag === requested_cross_tag) {
                    return(<span className='text-primary'>{tag}{comma}</span>);
                }
                return(<span className='text-muted'>{tag}{comma}</span>)
            }
        ));
        return [tag_array, tag_array]
    }else{
        if (tags.length === 0){
            return [<span className='text-danger'>No male fish available for supplementation!!</span>,
                "All of the fish in this family have been previously crossed for supplementation, only a refuge cross may be selected"]
        }
        return formatArrayToStr(tags)
    }
}

const sort_by_completed = (item_1, item_2, completed_tag) =>{
    if (item_1 === completed_tag){
        return -1;
    }
    return 0
}
