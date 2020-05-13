const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
//const session = require("express-session")
const cookieParser = require("cookie-parser")
const authRouter = require("./auth/auth-router")
const usersRouter = require("./users/users-router")

const server = express()
const port = process.env.PORT || 5000

// Global middleware
server.use(cors())
server.use(helmet())
server.use(express.json())
server.use(cookieParser())
// server.use(session({
// 	name: "sess", // overwrites the default cookie name, hides our stack better
// 	resave: false, // avoid recreating sessions that have not changed
// 	saveUninitialized: false, // GDPR laws against setting cookies automatically
// 	secret: "keep it secret, keep it safe", // cryptographically sign the cookie
// }))

server.use("/auth", authRouter)
server.use("/users", usersRouter)

server.get("/", (req, res, next) => {
	res.json({
		message: "Welcome to our API",
	})
})

server.use((err, req, res, next) => {
	console.log(err)
	res.status(500).json({
		message: "Something went wrong",
	})
})

server.listen(port, () => {
	console.log(`Running at http://localhost:${port}`)
})
