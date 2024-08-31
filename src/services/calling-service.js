const prisma = require("../../prisma/prisma");
const uuid = require("uuid").v4();

module.exports = {
    create: async (userId, to) => {

        const statusTarget = await prisma.users.findFirst({
            where: {
                username: to
            },
            select: {
                calling_status: {
                    select: {
                        room_code: true,
                        status: true
                    }
                },
                id: true
            }
        })

        if (statusTarget.calling_status.status) {
            throw new Error("User in another call")
        }

        const exist = await prisma.users.count({
            where: {
                id: userId
            }
        })

        if (!exist)
            throw new Error("User is not exist")

        const update = await prisma.calling_status.update({
            where: {
                user_id: userId
            },
            data: {
                room_code: uuid,
                status: true
            },
            select: {
                room_code: true
            }
        });

        return {
            result: update.room_code
        }
    },
    remove: async (username) => {
        

        const isUser = await prisma.users.findFirst({
            where: {
                username: username
            },
            select: {
                calling_status: {
                    select: {
                        room_code: true
                    }
                }
            }
        })

        const result = await prisma.calling_status.updateMany({
            where: {
                room_code: isUser.calling_status.room_code
            },
            data: {
                room_code: null,
                status: false
            }
        })

        return {
            result
        }
        
    },
    get: async (userId) => {

        return (await prisma.calling_status.findFirst({
            where: {
                user_id: userId
            }
        })).room_code
    },
    pick: async (room_code, username) => {

        const isUser = await prisma.users.findFirst({
            where: {
                username: username
            }
        })

        if (!isUser)
            throw new Error("User is not exist");
        

        return prisma.calling_status.update({
            where: {
                user_id: isUser.id
            },
            data: {
                room_code: room_code,
                status: true
            }
        })
    }
}