const groupService = require("../services/group-service")

module.exports = {
    create: async (req, socket, cb) => {
        try {
            const { member, result } = await groupService.create(req, cb);

            for (const user of member) {

                socket.to(user).emit("group-join", result)
            }

            cb(null, result)
        } catch (err) {
            cb(err.message)
        }
    },
    edit: async (req, current, socket, cb) => {
        try {
            const { member, result } = await groupService.edit(req, current.username);

            for (const user of member) {

                socket.to(user).emit("group-edit", result)
            }

            cb(null, result)
        } catch (err) {
            cb(err.message)
        }
    },
    kick: async (req, current, socket, cb) => {
        try {
            const { member, result } = await groupService.kick(req, current.username);

            for (const user of member) {
                socket.to(user).emit("group-kick", result)
            }

            cb(null, result)
        } catch (error) {
            cb(error.message)
        }
    },
    leave: async (req, socket, cb) => {
        try {
            const { member, result } = await groupService.leave(req);

            for (const user of member) {

                socket.to(user).emit("group-leave", result)
            }

            cb(null, result)
        } catch (error) {
            cb(error.message)
        }
    },
    disband: async (req, current, socket, cb) => {
        try {
            const { member, result } = await groupService.disband(req, current.username);

            for (const user of member) {

                socket.to(user).emit("group-disband", result)
            }

            cb(null, result)
        } catch (error) {
            cb(error.message)
        }
    },
    role: async (req, current, socket, cb) => {
        try {
            const { member, result } = await groupService.role(req, current.username);

            console.log(result);
            for (const user of member) {

                socket.to(user).emit("group-role", result)
            }

            cb(null, result)
        } catch (error) {
            cb(error.message)
        }
    },
}