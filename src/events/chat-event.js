const chatService = require("../services/chat-service")

module.exports = {
    getChat: async (req, current_user, socket) => {

        const { page, count, result, take } = await chatService.get_all(req, current_user)

        /**
         * 
         * sending result to sender
         */
        socket.emit("chat:get", result, page, Math.ceil(count.message.length / take))
    }
}