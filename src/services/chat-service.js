const prisma = require("../../prisma/prisma")

module.exports = {
    get_all: async (req, current_user) => {
        const take = 35;
        const page = req.page;
        const skip = (page - 1) * take;

        const count = req.type === "private" ?
            await prisma.contact.findFirst({
                where: {
                    contact_list_id: current_user.contact_list_id,
                    user: {
                        username: req.username
                    }
                },
                include: {
                    message: {
                        select: {
                            id: true,
                        },
                    }
                },
            }) :
            await prisma.group.findFirst({
                where: {
                    group_code: req.username
                },
                include: {
                    message: {
                        select: {
                            id: true
                        }
                    }
                }
            })
        /**
         * 
         * query by type chat
         */
        const result = req.type === "private" ?
            await prisma.contact.findFirst({
                where: {
                    contact_list_id: current_user.contact_list_id,
                    user: {
                        username: req.username
                    }
                },
                include: {
                    message: {
                        include: {
                            info_msg: true,
                            pull_msg: {
                                include: {
                                    msg: {
                                        include: {
                                            info_msg: true
                                        }
                                    }
                                }
                            }
                        },
                        skip: skip,
                        take: take,
                        orderBy: {
                            time: "desc"
                        }
                    }
                },
            }) :
            await prisma.group.findFirst({
                where: {
                    group_code: req.username
                },
                include: {
                    message: {
                        include: {
                            info_msg: true,
                            pull_msg: {
                                include: {
                                    msg: {
                                        include: {
                                            info_msg: true
                                        }
                                    }
                                }
                            }
                        },
                        skip: skip,
                        take: take,
                        orderBy: {
                            time: "desc"
                        }
                    }
                }
            })

        const payload = result !== null &&
            result.message.length ?
            result.message.map(
                foo => ({
                    id: foo.id,
                    msg: foo.msg,
                    time: foo.time,
                    forward: foo.forward,
                    src: foo.src,
                    type: foo.type,
                    info_msg: {
                        id: foo.info_msg.id,
                        to: foo.info_msg.to,
                        from: foo.info_msg.from,
                        sender_read: foo.info_msg.sender_read,
                        respon_read: foo.info_msg.respon_read,
                        type: foo.info_msg.type
                    },
                    ...(foo.pull_msg.msg.id !== foo.id && {
                        pull_msg: {
                            id: foo.pull_msg.msg.id,
                            msg: foo.pull_msg.msg.msg,
                            time: foo.pull_msg.msg.time,
                            src: foo.pull_msg.msg.src,
                            type: foo.pull_msg.msg.type,
                            forward: false,
                            info_msg: {
                                ...foo.pull_msg.msg.info_msg
                            }
                        }
                    })
                })) : []

        return {
            result: payload,
            take: take,
            page: page,
            count: count
        }
    }
}

/*
    Pyaload response
    
*/