import React from "react";
import {Navigate} from "react-router-dom";
import useSpeciesConfig, {featureEnabled} from "./useSpeciesConfig";

// Guards a route behind a species feature flag. While the config loads we render nothing; once
// known, a disabled feature redirects home so it can't be reached by direct URL in a deployment
// where that feature is off (e.g. Fish Care in delta smelt).
export default function RequireFeature({feature, children}) {
    const config = useSpeciesConfig();
    if (config === null) {
        return null;
    }
    if (!featureEnabled(config, feature)) {
        return <Navigate to="/" replace/>;
    }
    return children;
}
