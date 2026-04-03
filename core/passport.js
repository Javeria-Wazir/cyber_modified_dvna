var db = require('../models')
var LocalStrategy = require('passport-local').Strategy
var bcrypt = require('bcrypt')
var inputValidator = require('./inputValidator')

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.id)
    });

    passport.deserializeUser(function (uid, done) {
        db.User.findOne({
            where: {
                'id': uid
            }
        }).then(function (user) {
            if (user) {
                done(null, user);
            } else {
                done(null, false)
            }

        })
    })

    passport.use('login', new LocalStrategy({
            passReqToCallback: true
        },
        function (req, username, password, done) {
            var sanitizedLogin = inputValidator.sanitizeLogin(username)
            if (!sanitizedLogin || !inputValidator.isValidLoginPasswordInput(password)) {
                return done(null, false, req.flash('danger', 'Invalid Credentials'))
            }

            db.User.findOne({
                where: {
                    'login': sanitizedLogin
                }
            }).then(function (user) {
                if (!user) {
                    return done(null, false, req.flash('danger', 'Invalid Credentials'))
                }
                if (!isValidPassword(user, password)) {
                    return done(null, false, req.flash('danger', 'Invalid Credentials'))
                }
                return done(null, user);
            });
        }))

    var isValidPassword = function (user, password) {
        return bcrypt.compareSync(password, user.password);
    }

    passport.use('signup', new LocalStrategy({
            passReqToCallback: true
        },
        function (req, username, password, done) {
            var findOrCreateUser = function () {
                if (!(req.body.email && req.body.password && req.body.username && req.body.cpassword && req.body.name)) {
                    return done(null, false, req.flash('danger', 'Input field(s) missing'));
                }

                var sanitizedEmail = inputValidator.sanitizeEmail(req.body.email)
                var sanitizedLogin = inputValidator.sanitizeLogin(req.body.username)
                var sanitizedName = inputValidator.sanitizeName(req.body.name)
                if (!sanitizedEmail) {
                    return done(null, false, req.flash('danger', 'Invalid email'));
                }
                if (!sanitizedLogin) {
                    return done(null, false, req.flash('danger', 'Invalid username'));
                }
                if (!sanitizedName) {
                    return done(null, false, req.flash('danger', 'Invalid name'));
                }
                if (!inputValidator.isValidPasswordInput(req.body.password) || !inputValidator.isValidPasswordInput(req.body.cpassword)) {
                    return done(null, false, req.flash('danger', 'Invalid password format'));
                }

                if (req.body.cpassword != req.body.password) {
                    return done(null, false, req.flash('danger', 'Passwords dont match'));
                }

                db.User.findOne({
                    where: {
                        'login': sanitizedLogin
                    }
                }).then(function (user) {
                    if (user) {
                        return done(null, false, req.flash('danger', 'Account Already Exists'));
                    }

                    return bcrypt.hash(password, 10).then(function (hashedPassword) {
                        return db.User.create({
                            email: sanitizedEmail,
                            password: hashedPassword,
                            name: sanitizedName,
                            login: sanitizedLogin
                        })
                    }).then(function (createdUser) {
                        return done(null, createdUser)
                    }).catch(function (err) {
                        return done(err)
                    })
                }).catch(function (err) {
                    return done(err)
                })
            };
            process.nextTick(findOrCreateUser)
        }));

}