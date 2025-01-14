const authService = require("../services/auth-service");
const userService = require("../services/user-service");

module.exports = {
    register: async (req, res, next) => {
        try {
            const body = req.body;
            const result = await userService.create(body);
            res.status(200).json({ result });
        } catch (e) {
            next(e);
        }
    },
    login: async (req, res, next) => {
        try {
            const body = req.body;
            const result = await authService.login(body);
            res.cookie(
                "auth_token",
                result.token,
                {
                    httpOnly: true,
                    maxAge: 1000 * 60 * 60 * 24 * 7
                }
            );
            res.cookie(
                "_user",
                JSON.stringify({
                    id: result.id,
                    username: result.username
                }),
                {
                    maxAge: 1000 * 60 * 60 * 24 * 7
                }
            );
            res.cookie(
                "auth_socket",
                result.socket_token,
                {
                    maxAge: 1000 * 60 * 60 * 24 * 7,
                    httpOnly: true
                },
            )
            res.status(200).json({
                result: {
                    id: result.id,
                    username: result.username,
                    email: result.user.email,
                    first_name: result.user.user_info.first_name,
                    last_name: result.user.user_info.last_name,
                }
            });
            res.end();
        } catch (e) {
            next(e);
        }
    },
    logout: async (req, res, next) => {
        try {
            const reqLogout = {
                auth_token: req.cookies.auth_token,
                socket_token: req.cookies.auth_socket
            }
            await authService.logout(reqLogout);
            const cookies = Object.keys(req.cookies);
            cookies.forEach(cookie => res.clearCookie(cookie));
            res.status(200).json({
                result: "OK"
            })
            res.end();
        } catch (e) {
            next(e);
        }
    },
    me: async(req, res, next) => {
        try {
            const token = req.cookies.auth_token;
            const result = await authService.me(token);
            res.cookie(
                "_user",
                JSON.stringify({
                    id: result.id,
                    username: result.username
                }),
                {
                    maxAge: 1000 * 60 * 60 * 24 * 7
                }
            );
            res.status(200).json({
                result
            })
            res.end();
        } catch (e) {
            next(e);
        }
    }
}