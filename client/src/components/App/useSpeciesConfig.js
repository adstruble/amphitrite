import {useEffect, useState} from "react";

// Deployment config (species + feature flags) from the backend. Cached module-wide so the nav and
// route guards share a single fetch. The value drives which species-specific UI is shown, so the
// same client build works for any species deployment (delta smelt, LFS, ...).
let cached = null;
let inflight = null;

export function fetchSpeciesConfig() {
    if (cached) {
        return Promise.resolve(cached);
    }
    if (!inflight) {
        inflight = fetch('/amphitrite/common/config', {method: 'GET'})
            .then(res => res.json())
            .then(data => {
                cached = data;
                return data;
            })
            .catch(err => {
                inflight = null;  // allow a later retry
                throw err;
            });
    }
    return inflight;
}

export function featureEnabled(config, feature) {
    return !!(config && config.features && config.features[feature]);
}

// Returns the config object, or null while it is still loading.
export default function useSpeciesConfig() {
    const [config, setConfig] = useState(cached);

    useEffect(() => {
        let active = true;
        fetchSpeciesConfig()
            .then(c => { if (active) setConfig(c); })
            .catch(() => {});
        return () => { active = false; };
    }, []);

    return config;
}
