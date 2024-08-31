const callingService = require("../services/calling-service")

module.exports = {
    create: async (current, to, cb, socket) => {
        try {            
            const { result } = await callingService.create(current.id, to)
            socket.to(to).emit("calling:incoming", current.username, result)
            cb("", result)
        } catch (error) {
            console.error(error.message);
            
            cb("Internal server error")
        }
    },
    stream: async (st, to, socket) => {
        socket.to(to).emit("calling:stream", st);
    },
    pick: async (status, from, room_code, cb, current, socket) => {
        try {
            await callingService.pick(room_code, current.username);
            socket.to(from).emit("calling:pick", status, current.username);
            cb(null, room_code)
        } catch (error) {
            console.error(error.message);
            
            cb("Internal server error")
        }
    },
    close: async (type, to, cb, current, socket) => {
        try {
            await callingService.remove(to)
            socket.to(to).emit("calling:close", type, current.username);
            cb(null, to)
        } catch (error) {   
            console.error(error.message);
            
            cb("Internal server error")
        }
    }
}