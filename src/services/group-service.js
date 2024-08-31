const prisma = require("../../prisma/prisma");
const roles = require("../constants/roles");
const { roleExist } = require("../utils/common");
const uuid = require("uuid").v4

async function existGroup(code) {
    const isExist = await prisma.group.findFirst({
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

    if (!isExist)
        throw new Error("Group is not exist");

    return isExist
}

module.exports = {
    create: async (req) => {
        req.member.forEach(fo => {
            roleExist(fo)
        });
        return prisma.$transaction(async (tx) => {


            const createGroup = await tx.group.create({
                data: {
                    name: req.name,
                    bio: req.bio,
                    group_code: uuid(),
                    last_info: {
                        create: {
                            msg: ""
                        }
                    }
                },
                include: {
                    last_info: true
                }
            });

            const createMember = req.member.map(async (member) => {
                const user = await prisma.users.findUnique({
                    where: {
                        username: member.username
                    }
                });

                if (user) {
                    const result = await tx.group_member.create({
                        data: {
                            group_id: createGroup.id,
                            user_id: user.id,
                            role: member.role,
                        },
                        select: {
                            id: true,
                            role: true,
                            user: {
                                select: {
                                    username: true,
                                    email: true,
                                    user_info: true,
                                }
                            }
                        }
                    });

                    return {
                        id: result.id,
                        role: result.role,
                        username: result.user.username,
                        first_name: result.user.user_info.first_name || result.user.username,
                        last_name: result.user.user_info.last_name,
                        bio: result.user.user_info.bio,
                    }
                }
            });


            const member = await Promise.all(createMember);

            return {
                member: member.map(fo => fo.username),
                result: {
                    id: createGroup.id,
                    name: createGroup.name,
                    bio: createGroup.bio,
                    group_code: createGroup.group_code,
                    last_info: createGroup.last_info,
                    member: member
                }
            }
        })
    },
    get: async (req) => {
        return await prisma.group_member.findMany({
            where: {
                user_id: req
            },
            select: {
                group: {
                    include: {
                        group_member: true
                    }
                }
            }
        })
    },
    edit: async (req, current_username) => {
        const isGroup = await existGroup(req.group_code);

        const isExist = await prisma.group_member.findFirst({
            where: {
                group: {
                    group_code: req.group_code
                },
                user: {
                    username: current_username
                }
            }
        })

        if (!isExist)
            throw new Error("User is not found");

        if (isExist.role !== roles["ADMIN"])
            throw new Error("User is not permited");

        const update = await prisma.group.update({
            where: {
                id: isGroup.id
            },
            data: {
                bio: req.bio,
                name: req.name
            }
        })

        return {
            member: isGroup.group_member.map(fo => fo.user.username),
            result: {
                id: update.id,
                name: update.name,
                bio: update.bio,
                group_code: update.group_code,
            }
        }
    },
    kick: async (req, current_username) => {

        const isGroup = await existGroup(req.group_code);


        const isExist = await prisma.group_member.findFirst({
            where: {
                group: {
                    id: isGroup.id
                },
                user: {
                    username: current_username
                }
            }
        })

        if (!isExist)
            throw new Error("User is not found");

        if (req.member_id === isExist.id)
            throw new Error("User not permited")

        if (isExist.role !== roles["ADMIN"])
            throw new Error("User is not permited");

        const update = await prisma.group_member.delete({
            where: {
                id: isExist.id,
                group_id: isGroup.id,
            }
        })

        return {
            member: isGroup.group_member.map(fo => fo.user.username),
            result: {
                member_id: update.id,
            }
        }
    },
    disband: async (req, current_username) => {

        const isGroup = await existGroup(req.group_code);

        const isRole = await prisma.group_member.findFirst({
            where: {
                group: {
                    group_code: req.group_code
                },
                user: {
                    username: current_username
                }
            }
        })

        if (!isRole)
            throw new Error("User is not found");

        if (isRole.role !== roles["ADMIN"])
            throw new Error("User is not permited");

        await prisma.$transaction([
            prisma.last_info.delete({
                where: {
                    group_id: isGroup.id
                }
            }),
            prisma.group_member.deleteMany({
                where: {
                    group_id: isGroup.id
                }
            }),
            prisma.group.delete({
                where: {
                    id: isGroup.id
                },
            })
        ])

        return {
            member: isGroup.group_member.map(fo => fo.user.username),
            result: {
                group_code: req.group_code
            }
        }
    },
    leave: async (req) => {
        const isGroup = await existGroup(req.group_code);

        const update = await prisma.group_member.delete({
            where: {
                id: req.member_id
            },
            select: {
                id: true
            }
        })

        return {
            member: isGroup.group_member.map(fo => fo.user.username),
            result: {
                group_code: req.group_code,
                member_id: update.id
            }
        }
    },
    role: async (req, current_username) => {

        const isGroup = await existGroup(req.group_code, Object.values(roles));
        const admin_count = isGroup.group_member.filter(fo => fo.role === roles["ADMIN"]).length;

        if (isGroup.group_member.length === 1)
            throw new Error("User not permited")

        roleExist(req.role);

        const isExist = await prisma.group_member.findFirst({
            where: {
                group: {
                    group_code: req.group_code
                },
                user: {
                    username: current_username
                }
            }
        })

        if (!isExist)
            throw new Error("User is not found");

        if (isExist.role !== roles["ADMIN"])
            throw new Error("User is not permited");

        if (
            isExist.id === req.member_id &&
            req.role === roles["MEMBER"] &&
            admin_count === 1
        ) {
            const next_admin = isGroup.group_member.filter(fo => fo.id !== isExist.id);
            await prisma.group_member.update({
                where: {
                    id: next_admin[0].id
                },
                data: {
                    role: req.role
                }
            })
        }   
        
        
        const update = await prisma.group_member.update({
            where: {
                id: isExist.id,
                group_id: isGroup.id
            },
            data: {
                role: 12728,
            }
        })

        console.log(update);
        
    
        return {
            member: isGroup.group_member.map(fo => fo.user.username),
            result: {
                member_id: update.id,
                group_code: isGroup.group_code,
                role: update.role,
            }
        }
    }
}