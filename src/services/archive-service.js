const prisma = require("../../prisma/prisma")

module.exports = {
    add: async (contactId) => {
        const up = await prisma.contact.update({
            where: {
                id: contactId
            },
            data: {
                archive: true
            }
        })
        return up.first_name

    },
    remove: async (contactId) => {
        const up = await prisma.contact.update({
            where: {
                id: contactId
            },
            data: {
                archive: false
            }
        })

        return up.first_name
    }
}