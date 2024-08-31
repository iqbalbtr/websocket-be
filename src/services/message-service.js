const prisma = require("../../prisma/prisma");
const contactService = require("./contact-service");

module.exports = {
    private: async (msg, file, current) => {
        // get sender information 
        const sender = current.id;

        const target = await prisma.users.findFirst({
            where: {
                username: msg.info_msg.to
            },
            select: {
                contact_list: true
            }
        })

        if (!target)
            throw new Error("Error sending message")

        let newContact = null;
        // contactService.getContactByUser(current.contact_list_id, msg.info_msg.to);
        const targetContactIsExist = await prisma.contact.findFirst({
            where: {
                user_id: current.id,
                contact_list_id: target.contact_list.id
            }
        })

        // file url
        const urlFile = file && `${process.env.BASE_URL}/public/message/${current.username}/${file}`

        //  create message
        const createMsg = await prisma.message.create({
            data: {
                msg: msg.msg,
                forward: msg.forward,
                time: new Date(),
                src: urlFile,
                type: msg.type,
                info_msg: {
                    create: {
                        to: msg.info_msg.to,
                        from: msg.info_msg.from,
                        respon_read: false,
                        sender_read: true,
                        type: "private"
                    }
                },
                pull_msg: {
                    create: {
                        status: msg.pull_msg_id ? true : false,
                    },
                }
            },
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
            }
        })

        const pull_msg = createMsg.pull_msg.status ?
            await prisma.message.update({
                where: {
                    id: msg.pull_msg_id
                },
                data: {
                    pull_msg_id: createMsg.pull_msg_id
                },
                include: {
                    info_msg: true
                }
            }) : false



        // validate is responder exist in database
        const reponUser = await prisma.users.findFirst({
            where: {
                username: msg.info_msg.to,
            },
            select: {
                id: true,
                contact_list: {
                    select: {
                        id: true,
                    }
                }
            }
        })


        /**
         * find contact sender from user responder
         * if exist update contact last info
         * else create unsaved contact to user responder
         */

        const find = await prisma.contact.findFirst({
            where: {
                contact_list_id: reponUser.contact_list.id,
                user: {
                    username: msg.info_msg.from
                },
            },
            include: {
                last_info: true
            }
        })

        if (!find) {
            const result = await prisma.contact.create({
                data: {
                    first_name: `@${msg.info_msg.from}`,
                    contact_list_id: reponUser.contact_list.id,
                    user_id: sender,
                    unsaved: true,
                    last_info: {
                        create: {
                            msg: msg.type === "contact" ? msg.msg.split("%2f")[0] : msg.msg,
                            unread: 1
                        }
                    },
                    message: {
                        connect: {
                            id: createMsg.id
                        }
                    }
                },
                include: {
                    last_info: true,
                    user: {
                        include: {
                            user_info: true
                        }
                    }
                }
            })

            newContact = {
                id: result.id,
                name: `${result.first_name} ${result.last_name || " "}`,
                bio: result.user.user_info.bio,
                username: result.user.username,
                type: "private",
                last_info: {
                    id: result.last_info.id,
                    msg: result.last_info.msg,
                    time: result.last_info.time,
                    unread: 1,
                }
            }

        } else {
            const unread = ++find.last_info.unread
            !targetContactIsExist.block && await prisma.contact.update({
                where: {
                    contact_list_id: reponUser.contact_list.id,
                    user_id: find.user_id
                },
                data: {
                    last_info: {
                        update: {
                            msg: msg.type === "contact" ? msg.msg.split("%2f")[0] : msg.msg,
                            time: new Date(),
                            unread: unread
                        }
                    },
                    message: {
                        connect: {
                            id: createMsg.id
                        }
                    }
                }
            })
        }


        // update sender contact last info 
        await prisma.contact.update({
            where: {
                contact_list_id: current.contact_list_id,
                user_id: reponUser.id
            },
            data: {
                last_info: {
                    update: {
                        msg: msg.type === "contact" ? msg.msg.split("%2f")[0] : msg.msg,
                        time: new Date(),
                    }
                },
                message: {
                    connect: {
                        id: createMsg.id
                    }
                }
            }
        })

        const resultMsg = {
            id: createMsg.id,
            ...msg,
            src: createMsg.src,
            type: createMsg.type,
            info_msg: {
                id: createMsg.info_msg.id,
                ...msg.info_msg
            },
            ...(pull_msg && {
                pull_msg: {
                    id: pull_msg.id,
                    msg: pull_msg.msg,
                    time: pull_msg.time,
                    forward: false,
                    src: pull_msg.src,
                    type: pull_msg.type,
                    info_msg: {
                        ...pull_msg.info_msg
                    }
                }
            })
        }

        return {
            result: resultMsg,
            new_contact: newContact,
            block: targetContactIsExist
        }
    },
    edit_msg: async (id, msg, current) => {

        const find = await prisma.message.findFirst({
            where: {
                id: id
            },
            include: {
                info_msg: true
            }
        })

        if (!find)
            throw new Error("Erorr update message")

        const updateMsg = await prisma.message.update({
            where: {
                id: id
            },
            data: {
                msg: msg,
                info_msg: {
                    update: {
                        type: "edit"
                    }
                },
                time: new Date()
            },
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
            }
        })

        const resultMsg = {
            id: updateMsg.id,
            ...find,
            msg: msg,
            src: updateMsg.src,
            type: updateMsg.type,
            info_msg: {
                id: updateMsg.info_msg.id,
                ...find.info_msg
            },
        }

        const targetContactIsExist = await contactService.getContactByUser(current.contact_list_id, result.info_msg.to);

        return {
            result: resultMsg,
            block: targetContactIsExist
        }

    },
    group: async (msg, code, file, user_id) => {

        const group = await prisma.group.findFirst({
            where: {
                group_code: code
            },
            include: {
                group_member: {
                    include: {
                        user: true
                    }
                }
            }
        })

        if (!group)
            throw new Error("Group is not found")

        const urlSrc = `${process.env.BASE_URL}/public/message/${msg.info_msg.from}/${file}`

        // creae message group
        const createMsg = await prisma.message.create({
            data: {
                msg: msg.msg,
                forward: msg.forward,
                time: new Date(),
                src: urlSrc,
                type: msg.type,
                info_msg: {
                    create: {
                        to: msg.info_msg.to,
                        from: msg.info_msg.from,
                        respon_read: false,
                        sender_read: true,
                        type: "group"
                    }
                },
                pull_msg: {
                    create: {
                        status: msg.pull_msg_id ? true : false
                    }
                }
            },
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
            }
        })


        const pull_msg = createMsg.pull_msg.status ?
            await prisma.message.update({
                where: {
                    id: msg.pull_msg_id
                },
                data: {
                    pull_msg_id: createMsg.pull_msg_id
                },
                include: {
                    info_msg: true
                }
            }) : false



        // update last info current group 
        await prisma.group.update({
            where: {
                id: group.id
            },
            data: {
                message: {
                    connect: {
                        id: createMsg.id
                    }
                },
                last_info: {
                    update: {
                        msg: msg.type === "contact" ? msg.msg.split("%2f")[0] : msg.msg,
                        time: new Date()
                    }
                },
                group_member: {
                    updateMany: {
                        where: {
                            group_id: group.id,
                            NOT: [
                                {
                                    user_id: user_id
                                }
                            ]
                        },
                        data: {
                            unread: {
                                increment: 1
                            }
                        }
                    }
                }
            }
        })

        const resultMsg = {
            id: createMsg.id,
            ...msg,
            src: createMsg.src,
            type: createMsg.type,
            info_msg: {
                id: createMsg.info_msg.id,
                ...msg.info_msg
            },
            ...(pull_msg && {
                pull_msg: {
                    id: pull_msg.id,
                    msg: pull_msg.msg,
                    time: pull_msg.time,
                    forward: false,
                    info_msg: {
                        ...pull_msg.info_msg
                    }
                }
            })
        }

        // returm all member group and reuslt msg
        return {
            result: resultMsg,
            group: group,
            member: group.group_member.map(fo => fo.user.username)
        }
    },
    remove_msg: async (id) => {
        const exist = await prisma.message.update({
            where: {
                id: id
            },
            data: {
                del: true,
                msg: "Pesan telah di hapus"
            },
            include: {
                info_msg: true,
                pull_msg: {
                    include: {
                        msg: true
                    }
                }
            }
        })

        if (!exist)
            throw new Error("Message is not found")

        return {
            result: exist
        }
    },
    remove_all_msg: async (contactId) => {


        const find = await prisma.contact.findFirst({
            where: {
                id: contactId
            },
            select: {
                message: true
            }
        });

        if (!find)
            throw new Error("Contact is not found")

        const allIdMessage = find.message.map(foo => ({ id: foo.id }));

        const exist = await prisma.contact.update({
            where: {
                id: contactId
            },
            data: {
                last_info: {
                    update: {
                        msg: ""
                    }
                },
                message: {
                    disconnect: allIdMessage
                }
            }
        })
        if (!exist)
            throw new Error("Internal server error")

        return {
            result: "success"
        }
    },
    readed: async (req, current) => {
        return req.type === "private" ?
            await prisma.contact.update({
                where: {
                    id: req.current
                },
                data: {
                    last_info: {
                        update: {
                            unread: 0
                        }
                    }
                }
            }) :
            await prisma.group.update({
                where: {
                    id: req.current
                },
                data: {
                    group_member: {
                        update: {
                            where: {
                                group_id: req.current,
                                user_id: current.id
                            },
                            data: {
                                unread: 0
                            }
                        }
                    }
                }
            })

    }
}