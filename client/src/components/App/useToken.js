import { useState } from 'react';
import jwt_decode from 'jwt-decode'


export default function useToken() {
    const [token, setToken] = useState(getToken());

    const saveToken = userToken => {
        sessionStorage.setItem('token', JSON.stringify(userToken));
        setToken(userToken.token);
    }

    function getToken(){
        const tokenString = sessionStorage.getItem('token');
        const userToken = JSON.parse(tokenString);
        return userToken?.token
    }

   function getUsername() {
        const decoded_token = jwt_decode(getToken());
        return decoded_token.username;
    }

    return {
        setToken: saveToken,
        token,
        getUsername: getUsername
    }

}
