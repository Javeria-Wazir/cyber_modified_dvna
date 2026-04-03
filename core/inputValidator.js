var validator = require('validator')

module.exports.sanitizeEmail = function (email) {
	if (typeof email !== 'string') {
		return null
	}
	var normalizedEmail = validator.normalizeEmail(validator.trim(email))
	if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
		return null
	}
	return normalizedEmail
}

module.exports.sanitizeLogin = function (login) {
	if (typeof login !== 'string') {
		return null
	}
	var trimmedLogin = validator.trim(login)
	if (!validator.isLength(trimmedLogin, { min: 3, max: 40 })) {
		return null
	}
	if (!validator.matches(trimmedLogin, /^[a-zA-Z0-9_.-]+$/)) {
		return null
	}
	return trimmedLogin
}

module.exports.sanitizeName = function (name) {
	if (typeof name !== 'string') {
		return null
	}
	var sanitizedName = validator.escape(validator.trim(name))
	if (!validator.isLength(sanitizedName, { min: 1, max: 80 })) {
		return null
	}
	return sanitizedName
}

module.exports.sanitizeToken = function (token) {
	if (typeof token !== 'string') {
		return null
	}
	var trimmedToken = validator.trim(token)
	if (!validator.isLength(trimmedToken, { min: 32, max: 32 })) {
		return null
	}
	if (!validator.isHexadecimal(trimmedToken)) {
		return null
	}
	return trimmedToken
}

module.exports.isValidPasswordInput = function (password) {
	if (typeof password !== 'string') {
		return false
	}
	return validator.isLength(password, { min: 8, max: 128 })
}

module.exports.isValidLoginPasswordInput = function (password) {
	if (typeof password !== 'string') {
		return false
	}
	return validator.isLength(password, { min: 1, max: 128 })
}
