import {FormGroup, Input, Label} from "reactstrap";

export const formatDate = (date) => {
    date = new Date(date);
    if (date.getUTCMonth() === 0 && date.getUTCDate() === 1){
        console.error("Getting full year: " + date.getFullYear().toString())
        // Assume the month and day aren't actually known so only report year
        return date.getUTCFullYear().toString();
    }
    return new Date(date).toLocaleDateString(undefined, {
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

export const formatCheckbox = (checked, item, format_args) => {
    let rowCheckedCallback = format_args[0]
    //return <Checkbox checked={false} onChange={(e) => rowCheckedCallback(e, item.id)}/>
    return (<FormGroup check>
                <Label check>
                    <Input defaultChecked={item['selected']} type="checkbox" onChange={(e) => rowCheckedCallback(e, item)}/>
                    <span className="form-check-sign" />
                </Label>
            </FormGroup>);
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
