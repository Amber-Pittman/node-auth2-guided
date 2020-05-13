const jwt = require("jsonwebtoken")

function restrict(role = "normal") {
	return async (req, res, next) => {
		const authError = {
			message: "Invalid credentials",
		}

		try {
			// express-session will automatically get the session ID from the cookie
			// header, and check to make sure it's valid and the session for this user exists.
			// if (!req.session || !req.session.user) {
			// 	return res.status(401).json(authError)
			// }

			console.log(req.headers)
			              //req.headers.whateverTheNameOfTheHeaderIsItCouldBeCalledHello
			//const token = req.headers.authorization
			const token = req.cookies.token
			if (!token) {
				return res.status(401).json(authError)
			}

			jwt.verify(
				token, 
				process.env.JWT_SECRET, 
				(err, decodedPayload) => {
					if (err  || decodedPayload.userRole !== role) {
						return res.status(401).json(authError)
					} 
				req.token = decodedPayload
				next()
			})
		} catch(err) {
			next(err)
		}
	}
}

module.exports = restrict