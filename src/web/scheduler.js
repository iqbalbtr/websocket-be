const { schedule } = require("node-cron");
const prisma = require("../../prisma/prisma");

const messageScheduler = schedule('*/5 * * * *', async() => {
    
    /**
     * 
     * Deleting status user if less than now
     */


});

function initilaizeScheduler(){
    

    /**
     * 
     * Iniitalize all sheduller 
     */

    messageScheduler.start()
    
    console.log("Scheduler status is active")
}

module.exports = {
    initilaizeScheduler
}


