var db = require('../models')
var bcrypt = require('bcrypt')
var md5 = require('md5')
var jwt = require('jsonwebtoken')
var inputValidator = require('./inputValidator')

module.exports.isAuthenticated = function (req, res, next) {
	if (req.isAuthenticated()) {
		req.flash('authenticated', true)
		return next();
	}
	res.redirect('/login');
}

module.exports.isNotAuthenticated = function (req, res, next) {
	if (!req.isAuthenticated())
		return next();
	res.redirect('/learn');
}

module.exports.verifyJwt = function (req, res, next) {
	var authHeader = req.headers.authorization || ''
	var token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
	if (!token) {
		return res.status(401).json({ success: false, message: 'Token required' })
	}

	try {
		var decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
		req.jwtUser = decoded
		return next()
	} catch (err) {
		return res.status(401).json({ success: false, message: 'Invalid token' })
	}
}

module.exports.forgotPw = function (req, res) {
	var sanitizedLogin = inputValidator.sanitizeLogin(req.body.login)
	if (sanitizedLogin) {
		db.User.find({
			where: {
				'login': sanitizedLogin
			}
		}).then(user => {
			if (user) {
				// Send reset link via email happens here
				req.flash('info', 'Check email for reset link')
				res.redirect('/login')
			} else {
				req.flash('danger', "Invalid login username")
				res.redirect('/forgotpw')
			}
		}).catch(err => {
			req.flash('danger', 'Internal Error')
			res.redirect('/forgotpw')
		})
	} else {
		req.flash('danger', "Invalid login username")
		res.redirect('/forgotpw')
	}
}

module.exports.resetPw = function (req, res) {
	var sanitizedLogin = inputValidator.sanitizeLogin(req.query.login)
	var sanitizedToken = inputValidator.sanitizeToken(req.query.token)
	if (sanitizedLogin && sanitizedToken) {
		db.User.find({
			where: {
				'login': sanitizedLogin
			}
		}).then(user => {
			if (user) {
				if (sanitizedToken == md5(sanitizedLogin)) {
					res.render('resetpw', {
						login: sanitizedLogin,
						token: sanitizedToken
					})
				} else {
					req.flash('danger', "Invalid reset token")
					res.redirect('/forgotpw')
				}
			} else {
				req.flash('danger', "Invalid login username")
				res.redirect('/forgotpw')
			}
		}).catch(err => {
			req.flash('danger', 'Internal Error')
			res.redirect('/forgotpw')
		})
	} else {
		req.flash('danger', "Non Existant login username")
		res.redirect('/forgotpw')
	}
}

module.exports.resetPwSubmit = function (req, res) {
	var sanitizedLogin = inputValidator.sanitizeLogin(req.body.login)
	var sanitizedToken = inputValidator.sanitizeToken(req.body.token)
	if (req.body.password && req.body.cpassword && sanitizedLogin && sanitizedToken) {
		if (!inputValidator.isValidPasswordInput(req.body.password) || !inputValidator.isValidPasswordInput(req.body.cpassword)) {
			req.flash('danger', "Invalid password format")
			return res.redirect('/forgotpw')
		}

		if (req.body.password == req.body.cpassword) {
			db.User.find({
				where: {
					'login': sanitizedLogin
				}
			}).then(user => {
				if (user) {
					if (sanitizedToken == md5(sanitizedLogin)) {
						bcrypt.hash(req.body.password, 10).then(function (hashedPassword) {
							user.password = hashedPassword
							return user.save()
						}).then(function () {
							req.flash('success', "Passowrd successfully reset")
							res.redirect('/login')
						}).catch(function () {
							req.flash('danger', 'Internal Error')
							res.redirect('/forgotpw')
						})
					} else {
						req.flash('danger', "Invalid reset token")
						res.redirect('/forgotpw')
					}
				} else {
					req.flash('danger', "Invalid login username")
					res.redirect('/forgotpw')
				}
			}).catch(err => {
				req.flash('danger', 'Internal Error')
				res.redirect('/forgotpw')
			})
		} else {
			req.flash('danger', "Passowords do not match")
			res.render('resetpw', {
				login: sanitizedLogin,
				token: sanitizedToken
			})
		}

	} else {
		req.flash('danger', "Invalid request")
		res.redirect('/forgotpw')
	}
}