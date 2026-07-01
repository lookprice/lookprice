const jwt = require("jsonwebtoken");
const token = jwt.sign({ id: 1, email: "lookprice.me@gmail.com", store_id: 2, role: "superadmin" }, process.env.JWT_SECRET || "supersecretkey");
console.log(token);
