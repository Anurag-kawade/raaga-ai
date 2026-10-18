const mongoose = require("mongoose");

function connectToDB(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Connected to DB")
    })
    .catch(err=>{
        console.log("Error connected to DB",err)
    })
}

module.exports = connectToDB;