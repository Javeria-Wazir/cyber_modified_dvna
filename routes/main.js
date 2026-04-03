var router = require('express').Router()
var vulnDict = require('../config/vulns')
var authHandler = require('../core/authHandler')
var inputValidator = require('../core/inputValidator')
var jwt = require('jsonwebtoken')

module.exports = function (passport) {
	var validateRegisterInput = function (req, res, next) {
		var email = req.body && req.body.email ? req.body.email : ''
		var sanitizedEmail = inputValidator.sanitizeEmail(email)
		if (!sanitizedEmail) {
			return res.status(400).send('Invalid email')
		}
		req.body.email = sanitizedEmail
		return next()
	}

	router.get('/', authHandler.isAuthenticated, function (req, res) {
		res.redirect('/learn')
	})

	router.get('/login', authHandler.isNotAuthenticated, function (req, res) {
		res.render('login')
	})

	router.get('/learn/vulnerability/:vuln', authHandler.isAuthenticated, function (req, res) {
		res.render('vulnerabilities/layout', {
			vuln: req.params.vuln,
			vuln_title: vulnDict[req.params.vuln],
			vuln_scenario: req.params.vuln + '/scenario',
			vuln_description: req.params.vuln + '/description',
			vuln_reference: req.params.vuln + '/reference',
			vulnerabilities:vulnDict
		}, function (err, html) {
			if (err) {
				console.log(err)
				res.status(404).send('404')
			} else {
				res.send(html)
			}
		})
	})

	router.get('/learn', authHandler.isAuthenticated, function (req, res) {
		res.render('learn',{vulnerabilities:vulnDict})
	})

	router.get('/register', authHandler.isNotAuthenticated, function (req, res) {
		res.render('register')
	})

	router.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	})

	router.get('/forgotpw', function (req, res) {
		res.render('forgotpw')
	})

	router.get('/resetpw', authHandler.resetPw)

	router.post('/login', passport.authenticate('login', {
		successRedirect: '/learn',
		failureRedirect: '/login',
		failureFlash: true
	}))

	router.post('/api/token', function (req, res, next) {
		req.body = req.body || {}
		if (!req.body.username && req.body.login) {
			req.body.username = req.body.login
		}

		if (!req.body.username || !req.body.password) {
			return res.status(400).json({
				success: false,
				message: 'username and password are required'
			})
		}

		passport.authenticate('login', { session: false }, function (err, user) {
			if (err) {
				return next(err)
			}
			if (!user) {
				return res.status(401).json({ success: false, message: 'Invalid Credentials' })
			}

			var token = jwt.sign(
				{ id: user.id, login: user.login },
				process.env.JWT_SECRET || 'your-secret-key',
				{ expiresIn: '1h' }
			)

			return res.json({ success: true, token: token })
		})(req, res, next)
	})

	router.get('/api/me', authHandler.verifyJwt, function (req, res) {
		res.json({
			success: true,
			user: req.jwtUser
		})
	})

	router.post('/register', validateRegisterInput, passport.authenticate('signup', {
		successRedirect: '/learn',
		failureRedirect: '/register',
		failureFlash: true
	}))

	router.post('/forgotpw', authHandler.forgotPw)

	router.post('/resetpw', authHandler.resetPwSubmit)

	return router
}