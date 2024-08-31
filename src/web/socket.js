const callingEvent = require("../events/calling-event");
const chatEvent = require("../events/chat-event");
const groupEvent = require("../events/group-event");
const messageEvent = require("../events/message-event");
const userEvent = require("../events/user-event");
const callingService = require("../services/calling-service");
const groupService = require("../services/group-service");
const { updateActiveUser } = require("../utils/socket/updateActiveUser");

let client_active = {
    count: 0,
    users: [],
};

async function initializeSocket(io) {

    /**
     * 
     * Connect on websocket
     */
    io.on("connection", async (socket) => {


        /**
         * Current user active
         */
        const current_user = socket.user;

        /**
         * 
         * Join user for her room 
         * and group room
         */
        socket.join(current_user.username);
        (await groupService.get(socket.user.id)).
            forEach(foo => {
                if (foo) {
                    socket.join(foo.group.group_code);
                }
            });

        const callingRoom = await callingService.get(current_user.id);
        socket.join(callingRoom);


        /** 
         * 
         * Update store active user
        */
        client_active = updateActiveUser(client_active, current_user);

        /**
         * 
         * Emit user status
         */
        userEvent.active(current_user, client_active, socket);


        /**
         * 
         * Event handler
         */


        socket.on("message:private", (msg, file, cb) => messageEvent.private(msg, current_user, file, cb, socket));
        socket.on("message:group", (msg, code, file, cb) => messageEvent.group(msg, code, file, cb, current_user, socket));
        socket.on("message:edit", (id, input) => messageEvent.edit_msg(id, input, cb, socket, current_user));
        socket.on("message:readed", (msg, cb) => messageEvent.readed(msg, cb, current_user));
        socket.on("message:remove", (id, cb) => messageEvent.remove_msg(id, cb));
        socket.on("message:remove-all", (id, cb) => messageEvent.remove_all_msg(id, cb));

        socket.on("chat:get", req => chatEvent.getChat(req, current_user, socket))

        socket.on("group:create", (req, cb) => groupEvent.create(req, socket, cb))
        socket.on("group:leave", (req, cb) => groupEvent.leave(req, socket, cb))
        socket.on("group:disband", (req, cb) => groupEvent.disband(req, current_user, socket, cb))
        socket.on("group:kick", (req, cb) => groupEvent.kick(req, current_user, socket, cb))
        socket.on("group:role", (req, cb) => groupEvent.role(req, current_user, socket, cb))
        socket.on("group:edit", (req, cb) => groupEvent.edit(req, current_user, socket, cb))

        socket.on("auth:sign-out", req => userEvent.logout(client_active, req, (result) => { client_active = result }));
        
        socket.on("calling:create", (to, callback) => callingEvent.create(current_user, to, callback, socket));
        socket.on("calling:stream", (st, to) => callingEvent.stream(st, to, socket));
        socket.on("calling:pick", (status, from, room_code, cb) => callingEvent.pick(status, from, room_code, cb, current_user, socket));
        socket.on("calling:close", (type, to, cb) => callingEvent.close(type, to, cb, current_user, socket));
        
        socket.on("disconnect", () => userEvent.disconnect(client_active, current_user, socket));
        
        // Logging
        console.log("User active => ", client_active.users.map((client) => ({ username: client.username, active: client.active })));
        console.log("User count => ", client_active.count)
    })
}

module.exports = {
    initializeSocket
}