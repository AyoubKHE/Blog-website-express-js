const jwt = require('jsonwebtoken');


function handle(request, response, next) {

    function manageExpiredToken() {

        function buildNewAccessToken(userID) {
            return jwt.sign(
                {
                    userData:
                    {
                        userID: userID
                    },
                    iat: Date.now(),
                    exp: Math.floor(Date.now() / 1000) + (900), // 15 minutes
                },
                process.env.JWT_SECRET
            );
        }

        let refreshToken = request.cookies["refreshToken"];
        if (refreshToken != undefined) {
            try {
                let refreshTokenPayload = jwt.verify(refreshToken, process.env.JWT_SECRET);
                let newAccessToken = buildNewAccessToken(refreshTokenPayload.userData.userID);
                response.cookie('accessToken', newAccessToken, { secure: true, httpOnly: true });
                return next();
            } catch (error) {
    
                return response.sendStatus(401);
            }
        }
        else {
            return response.sendStatus(401);
        }
    }

    let accessToken = request.cookies["accessToken"];

    if (accessToken != undefined) {
        try {
            let accessTokenPayload = jwt.verify(accessToken, process.env.JWT_SECRET);
            next();
        } catch (error) {

            if (error.name === 'TokenExpiredError') {
                return manageExpiredToken();
            }
            else {
                return response.sendStatus(401);
            }
        }
    }
    else {
        return response.sendStatus(401);
    }
}


module.exports = { handle };