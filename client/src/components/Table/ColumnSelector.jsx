import React, {useState} from "react";
import {Button, Col, FormGroup, Input, Label, Row} from "reactstrap";
import classnames from "classnames";
import PropTypes from "prop-types";

// Bullet-list toolbar control that toggles which AmphiTable columns are visible. Drop it into
// AmphiTable's `tableControl` slot; the parent owns the visible-keys set and re-renders the table
// with the filtered column list.
export default function ColumnSelector({columns, visibleKeys, onToggle}) {
    const [open, setOpen] = useState(false);

    return (
        // Bottom-aligned in the toolbar, then lifted ~15px so the icon sits at the same height as
        // the pagination arrows (which float ~15px above the table). alignSelf is a no-op outside
        // a flex parent.
        <div style={{position: 'relative', display: 'flex', alignItems: 'flex-end',
                     alignSelf: 'flex-end', marginBottom: '15px'}}>
            <i className={classnames("tim-icons icon-bullet-list-67 clickable", open && "text-info")}
               style={{marginLeft: '12px'}}
               title="Show/hide columns"
               onClick={() => setOpen(o => !o)}/>
            {open && (
                <div style={{position: 'absolute', top: '100%', right: 0, zIndex: 100, width: '320px',
                             border: '1px solid #1d8cf8', padding: '10px', backgroundColor: '#1e1e2f'}}>
                    <Row style={{margin: '0 0 8px 0'}}>
                        {columns.map(col => {
                            // Don't let the last visible column be turned off.
                            const isLastVisible = visibleKeys.has(col.key) && visibleKeys.size === 1;
                            return (
                                <Col xs={6} key={col.key} style={{padding: '2px 8px'}}>
                                    <FormGroup check style={{margin: 0}}>
                                        <Label check>
                                            <Input type="checkbox"
                                                   checked={visibleKeys.has(col.key)}
                                                   disabled={isLastVisible}
                                                   onChange={() => onToggle(col.key)}/>
                                            <span className="form-check-sign">{col.name}</span>
                                        </Label>
                                    </FormGroup>
                                </Col>
                            );
                        })}
                    </Row>
                    <Row style={{margin: 0}}>
                        <div style={{display: 'flex', marginLeft: 'auto'}}>
                            <Button type="button" onClick={() => setOpen(false)}>Close</Button>
                        </div>
                    </Row>
                </div>
            )}
        </div>
    );
}

ColumnSelector.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.object).isRequired,  // [{key, name}, ...]
    visibleKeys: PropTypes.instanceOf(Set).isRequired,
    onToggle: PropTypes.func.isRequired,
};
