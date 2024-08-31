const messageService = require("../services/message-service");

module.exports = {
    private: async (msg, current, file, cb, socket) => {
        try {

            /**  
             * Validate is user responder exist in database
            */
            const { result, new_contact, block } = await messageService.private(msg, file, current);

            if (new_contact) {
                socket.to(msg.info_msg.to).emit("new-contact", new_contact);
            }

            // sending message to responder
            if (!block.block) {
                socket.to(msg.info_msg.to).emit("message:private", result);
            }

            cb(null, result)

        } catch (error) {
            cb("Internal server error")
        }
    },
    group: async (msg, code, file, cb, current, socket) => {
        try {
            const { group, member, result } = await messageService.group(msg, code, file, current.id);
            // Sending message for each member group
            member.forEach(user => {
                socket.to(user).emit("message:group", result, group.group_code)
            })

            cb(null, result)
        } catch (error) {
            cb("Internal server error")
            console.error(error);
        }

    },
    readed: async (req, cb, current) => {
        try {

            /**
             * 
             * update contact last info by type contact
             */
            const result = await messageService.readed(req, current)
            cb(null, result)
        } catch (error) {
            cb("Internal server error")            
        }
    },
    remove_msg: async (id, cb) => {
        try {
            const { result } = await messageService.remove_msg(id)
            cb(null, result)
        } catch (error) {
            cb("Internal server error")
            console.error(error);
            
        }
    },
    remove_all_msg: async (id, cb) => {
        try {
            const { result } = await messageService.remove_all_msg(id);
            cb(null, result)
        } catch (error) {
            cb("Internal server error")
            console.error(error);
            
        }
    },
    edit_msg: async (id, msg, cb, socket, current) => {
        try {
            const { block, result } = await messageService.edit_msg(id, msg, current)
            // sending message to responder
            if (!block.block) {
                socket.to(result.info_msg.to).emit("message:private", result);
            }

            // sending result message to sender
            socket.emit("message:callback", result);
            cb(null, result)
            // socket.to(msg.info_msg.to).emit("last_info", result);
        } catch (error) {
            cb("Internal server error")
            console.error(error);
            
        }
    }
}