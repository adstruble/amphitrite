import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';


// Returns the stored JWT only if it is actually decodable. A missing, malformed, or partially
// written token (e.g. from a failed login) is cleared and treated as "not logged in", so the app
// falls back to the login screen instead of crashing when something calls jwtDecode on it.
function readValidToken() {
    try {
        const userToken = JSON.parse(sessionStorage.getItem('token'));
        const token = userToken?.token;
        if (token) {
            jwtDecode(token); // throws for anything that isn't a valid JWT string
            return token;
        }
    } catch {
        sessionStorage.removeItem('token');
    }
    return undefined;
}


export default function useToken() {
    const [token, setToken] = useState(readValidToken());

    const saveToken = userToken => {
        sessionStorage.setItem('token', JSON.stringify(userToken));
        setToken(userToken?.token);
    }

    function getUsername() {
        const validToken = readValidToken();
        try {
            return validToken ? jwtDecode(validToken).username : null;
        } catch {
            return null;
        }
    }

    return {
        setToken: saveToken,
        token,
        getUsername: getUsername
    }
}
