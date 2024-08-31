const roles = require("../constants/roles")

function roleExist(role) {
    return Object.values(roles).includes(role) ? 
    role : Error("Role is not exist") 
}

module.exports = {
    roleExist
}