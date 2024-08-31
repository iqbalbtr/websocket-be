const prisma = require("../../prisma/prisma")

module.exports = {
    add: async (contactId) => {
        return await prisma.contact.update({
            where: {
                id: contactId
            },
            data: {
                block: true
            },
            select: {
                first_name: true
            }
        })
    },
    remove: async (contactId) => {
        return await prisma.contact.update({
            where: {
                id: contactId
            },
            data: {
                block: false
            },
            select: {
                first_name: true
            }
        })
    }
}