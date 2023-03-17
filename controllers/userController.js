const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Goal = require('../models/progModel');
const nodemailer = require("nodemailer");
const Cryptr = require('cryptr');
const moment = require('moment-business-days');

const cryptr = new Cryptr(process.env.CRYPTR);


const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, compName, curs, dogov, dne } = req.body
    const psw = password
    // for (let i = 0; i < curs.length; i++) {
    //     let D = new Date();
    //     let Dst = new Date();
    //     curs[i].strt = Dst
    //     D.setDate(D.getDate() + Number(curs[i].dlit));
    //     curs[i].dlit = D
    // }
    crs = {}
    if (curs) {
        let D = new Date();
        const plusDney = Number(curs.split(',')[1]) / dne
        const god = D.getFullYear()
        const month = D.getMonth() + 1
        const day = D.getDate()

        const dat = moment(`${day}-${month}-${god}`, "DD-MM-YYYY").businessAdd(plusDney)._d;
        let Dst = new Date();
        crs.strt = Dst
        // D.setDate(D.getDate() + );
        crs.dlit = dat
        crs.name = curs.split(',')[0]
    }


    if (!name || !email || !password) {
        res.status(400).json({
            message: "Please add all fields"
        })
    }

    const userExists = await User.findOne({ email })

    if (userExists) {
        res.status(400)
        throw new Error('User arleady exists')
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(psw, salt)



    const user = await User.create({
        name,
        compName,
        role,
        email,
        password: hashedPassword,
        refresh: '',
        curs: crs,
        dogov
    })

    if (user) {
        if (user.curs.name != undefined && typeof (user.curs) == 'object') {
            let transporter = nodemailer.createTransport({
                host: "smtp.yandex.ru",
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_USER_PASSWORD,
                },
            });

            // send mail with defined transport object
            let message = {
                from: process.env.EMAIL_USER, // sender address
                to: email, // list of receivers
                subject: `Вы поступили на программу ${user.curs.name}`, // Subject line
                text: `Поздравляем с успешным поступлением на программу ${user.curs.name}. Данные для входа в приложении -> 
                Login: ${user.email}
                Password: ${password}`, // plain text body
            };
            transporter.sendMail(message);

            res.status(201).json({
                _id: user.id,
                //Access_Token: generateAccessToken(user._id),
                //Refresh_Token: refresh,
            })
        } else {
            let transporter = nodemailer.createTransport({
                host: "smtp.yandex.ru",
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_USER_PASSWORD,
                },
            });

            // send mail with defined transport object
            let message = {
                from: process.env.EMAIL_USER, // sender address
                to: email, // list of receivers
                subject: `Вы были зарегистрированы в приложении центра профессионального образования`, // Subject line
                text: `Вы были зарегистрированы в приложении центра профессионального образования. Ваши данные для входа -> 
                Login: ${user.email}
                Password: ${password}`, // plain text body
            };
            transporter.sendMail(message);

            res.status(201).json({
                _id: user.id,
                //Access_Token: generateAccessToken(user._id),
                //Refresh_Token: refresh,
            })
        }


    } else {
        res.status(400).json({
            message: "Invalid user data"
        });
        //throw new Error('Invalid user data')
    }

})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, auth } = req.body


    const user = await User.findOne({ email })


    if (user && (await bcrypt.compare(password, user.password))) {
        const userr = user

        jwt.verify(user.refresh, process.env.JWT_SECRET_REFRESH, (err, user) => {
            if (!err && auth != "undefined") {

                return res.status(200).json({
                    id: userr.id,
                    role: userr.role,
                    name: userr.name,
                    Access_Token: generateAccessToken(userr.id),
                    Refresh_Token: userr.refresh,
                })
            } else {
                const numb = Math.floor(Math.random(10000) * 100000);
                User.findOneAndUpdate({ _id: userr._id }, { code: numb }, { upsert: true }, function (err, doc) {
                    if (err) {
                        res.status(500).json({
                            message: "err"
                        });
                    } else {
                        let transporter = nodemailer.createTransport({
                            host: "smtp.yandex.ru",
                            port: 465,
                            secure: true, // true for 465, false for other ports
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_USER_PASSWORD,
                            },
                        });

                        // send mail with defined transport object
                        let message = {
                            from: process.env.EMAIL_USER, // sender address
                            to: userr.email, // list of receivers
                            subject: "В ваш аккаунт пытаются войти с нового устройства", // Subject line
                            text: `Ваш код для входа -> "${numb}" . Если это были не вы, то срочно смените пароль!`, // plain text body
                        };
                        transporter.sendMail(message).then((info) => {
                            return res.status(201)
                                .json({
                                    id: userr.id,
                                    message: "new add",
                                    Access_Token: generateAccessToken(userr.id),
                                })
                        })
                    }
                })


            }
        })



    } else {
        res.status(400).json({
            message: `Invalid credentials`
        })
    }
})


// USER PAGE


const userCurs = asyncHandler(async (req, res) => {
    const { id } = req.body

    const user = await User.findById(id);

    if (user.role == 'user') {
        jwt.verify(user.refresh, process.env.JWT_SECRET_REFRESH, (err, usert) => {
            if (!err) {
                if (typeof (user.curs) == 'object') {
                    res.status(200).json(
                        {
                            cursName: user.curs.name,
                            name: user.name,
                            cursStart: user.curs.strt,
                            cursStop: user.curs.dlit,
                            vupolnsCurs: user.vupolnsCurs
                        }
                    );
                } else {
                    res.status(200).json(
                        {
                            cursName: user.curs,
                            name: user.name,
                            vupolnsCurs: user.vupolnsCurs
                        }
                    );
                }

            } else {
                res.status(400).json({
                    message: 'err'
                })
            }
        });
    } else {
        res.status(400).json({
            message: `error role`
        })
    }
})
// END USER PAGE



// COMPANS PAGE

const compsSotr = asyncHandler(async (req, res) => {
    const { id } = req.body

    const user = await User.findById(id);

    if (user.role == 'pred') {
        jwt.verify(user.refresh, process.env.JWT_SECRET_REFRESH, (err, usert) => {
            if (!err) {
                User.find({ "compName": user.compName }).sort({ createdAt: -1 }).exec(function (err, doc) {
                    const fg = []
                    for (let i = 0; i < doc.length; i++) {
                        if (typeof (doc[i].curs) == 'object' && doc[i].role != 'pred' && doc[i].role != 'admin') {
                            fg.push({
                                name: doc[i].name,
                                compName: doc[i].compName,
                                notif: doc[i].notif,
                                vupolnsCurs: doc[i].vupolnsCurs,
                                dogov: doc[i].dogov,
                                email: doc[i].email,
                                cursName: doc[i].curs.name,
                                cursStart: doc[i].curs.strt,
                                cursStop: doc[i].curs.dlit

                            })
                        } else if (doc[i].role != 'pred' && doc[i].role != 'admin') {
                            fg.push({
                                name: doc[i].name,
                                compName: doc[i].compName,
                                vupolnsCurs: doc[i].vupolnsCurs,
                                notif: doc[i].notif,
                                dogov: doc[i].dogov,
                                email: doc[i].email,
                                cursName: doc[i].curs,
                            })
                        }

                    }
                    res.status(200).json(
                        fg
                    );
                });

            } else {
                res.status(400).json({
                    message: 'err'
                })
            }
        });
    } else {
        res.status(400).json({
            message: `error role`
        })
    }
})

// END COMPANS PAGE



const allUsAdm = asyncHandler(async (req, res) => {
    const { id } = req.body

    const user = await User.findById(id);
    if (user.role == 'admin') {
        jwt.verify(user.refresh, process.env.JWT_SECRET_REFRESH, (err, user) => {
            if (!err) {
                const fg = []
                User.find({ "role": "user" }).sort({ createdAt: -1 }).exec(function (err, doc) {
                    for (let i = 0; i < doc.length; i++) {
                        doc[i].password = ''
                        doc[i].code = ''
                        doc[i].refresh = ''
                        if (doc[i].curs.dlit != undefined && doc[i].curs != undefined) {
                            let l1 = String(doc[i].curs.strt)
                            let l2 = String(doc[i].curs.dlit)
                            date = new Date(l1)
                            date1 = new Date(l2)

                            fg.push({
                                name: doc[i].name,
                                id: doc[i]._id,
                                compName: doc[i].compName,
                                notif: doc[i].notif,
                                dogov: doc[i].dogov,
                                email: doc[i].email,
                                cursName: doc[i].curs.name,
                                cursStart: date.toDateString(),
                                cursStop: date1.toDateString()

                            })
                        } else {
                            fg.push({
                                name: doc[i].name,
                                id: doc[i]._id,
                                compName: doc[i].compName,
                                notif: doc[i].notif,
                                dogov: doc[i].dogov,
                                email: doc[i].email,
                                curs: doc[i].curs
                            })
                        }

                    }
                    res.status(200).json(
                        fg
                    );
                });
            } else {
                res.status(400).json({
                    message: `error role`
                })
            }
        })
    } else {
        res.status(400).json({
            message: `Invalid credentials`
        })
    }
})



const prTime = asyncHandler(async (req, res) => {
    const { id } = req.body

    const user = await User.findById(id);

    Date.prototype.addDays = function (days) {
        let date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }

    if (user.role == 'admin') {
        jwt.verify(user.refresh, process.env.JWT_SECRET_REFRESH, (err, user) => {
            if (!err) {
                User.find({ "role": "user" }).sort({ createdAt: -1 }).exec(function (err, doc) {
                    const fgh = []
                    let D = new Date();

                    for (let i = 0; i < doc.length; i++) {
                        if (doc[i].curs.dlit != undefined && D.addDays(1).getDate() == doc[i].curs.dlit.getDate()) {
                            if (doc[i].notif == 'true' && doc[i].not == 'false') {
                                User.findOneAndUpdate({ _id: doc[i]._id }, { not: 'true' }, { upsert: true }, function (err, doc) {
                                    if (err) return console.log(500, { error: err });
                                })
                                let transporter = nodemailer.createTransport({
                                    host: "smtp.yandex.ru",
                                    port: 465,
                                    secure: true, // true for 465, false for other ports
                                    auth: {
                                        user: process.env.EMAIL_USER,
                                        pass: process.env.EMAIL_USER_PASSWORD,
                                    },
                                });

                                // send mail with defined transport object
                                let message = {
                                    from: process.env.EMAIL_USER, // sender address
                                    to: doc[i].email, // list of receivers
                                    subject: "Центр профессионального образования", // Subject line
                                    text: `Центр профессионального образования уведомляет вас, что сегодня у вас последний день, чтобы пройти итоговую аттестацию по курсу ${doc[i].curs.name}`, // plain text body
                                };
                                transporter.sendMail(message)
                            }
                            let l1 = String(doc[i].curs.strt)
                            let l2 = String(doc[i].curs.dlit)
                            date = new Date(l1)
                            date1 = new Date(l2)
                            fgh.push({
                                name: doc[i].name,
                                compName: doc[i].compName,
                                id: doc[i].id,
                                dogov: doc[i].dogov,
                                email: doc[i].email,
                                cursName: doc[i].curs.name,
                                cursStart: date.toDateString(),
                                cursStop: date1.toDateString()
                            })
                        }
                    }
                    res.status(200).json(
                        fgh
                    );
                })
            } else {
                res.status(400).json({
                    message: `err`
                })
            }

        });
    } else {
        res.status(400).json({
            message: `error role`
        })
    }
})



const getMe = asyncHandler(async (req, res) => {
    const { name, _id, email } = await User.findById(req.user.id);

    res.status(200).json({
        name,
        id: _id,
        email,
    });
})




const vupok = asyncHandler(async (req, res) => {
    const { id, admem } = req.body


    const user = await User.findById(id);

    if (user) {
        if (user.notif == 'true') {
            if (user.curs != 'Выучился') {
                const dr = user.curs.name
                const drSt = user.curs.strt
                const drStop = user.curs.dlit
                User.findOneAndUpdate({ _id: id }, { curs: 'Выучился' }, { upsert: true }, function (err, doc) {
                    if (err) return console.log(500, { error: err });

                    const vupolnsCurs = user.vupolnsCurs
                    vupolnsCurs.push({
                        name: dr,
                        strt: drSt,
                        dlit: drStop
                    })

                    User.findOneAndUpdate({ _id: id }, { vupolnsCurs: vupolnsCurs }, { upsert: true }, function (err, doc) {
                        if (err) return console.log(500, { error: err });

                    })
                    let transporter = nodemailer.createTransport({
                        host: "smtp.yandex.ru",
                        port: 465,
                        secure: true, // true for 465, false for other ports
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_USER_PASSWORD,
                        },
                    });

                    // send mail with defined transport object
                    let message = {
                        from: process.env.EMAIL_USER, // sender address
                        to: [admem, user.email], // list of receivers
                        subject: `Пользователь ${user.name} успешно прошёл курс ${dr}`, // Subject line
                        text: `Вы видите это письмо, потому пользователь ${user.name} успешно прошёл курс ${dr}`, // plain text body
                    };
                    transporter.sendMail(message).then((info) => {
                        return res.status(201)
                            .json({
                                message: "OK",
                            })
                    })

                });
            } else {
                res.status(400).json({
                    message: 'Vup es'
                })
            }

        } else {
            const user = await User.findById(id);
            const dr = user.curs.name
            const drSt = user.curs.strt
            const drStop = user.curs.dlit
            User.findOneAndUpdate({ _id: id }, { curs: 'Выучился' }, { upsert: true }, function (err, doc) {
                if (err) return console.log(500, { error: err });


                const vupolnsCurs = user.vupolnsCurs
                vupolnsCurs.push({
                    name: dr,
                    strt: drSt,
                    dlit: drStop
                })

                User.findOneAndUpdate({ _id: id }, { vupolnsCurs: vupolnsCurs }, { upsert: true }, function (err, doc) {
                    if (err) return console.log(500, { error: err });

                })
                let transporter = nodemailer.createTransport({
                    host: "smtp.yandex.ru",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_USER_PASSWORD,
                    },
                });

                // send mail with defined transport object
                let message = {
                    from: process.env.EMAIL_USER, // sender address
                    to: admem, // list of receivers
                    subject: `Пользователь ${user.name} успешно прошёл курс ${dr}`, // Subject line
                    text: `Вы видите это письмо, потому пользователь ${user.name} успешно прошёл курс ${dr}`, // plain text body
                };
                transporter.sendMail(message).then((info) => {
                    return res.status(201)
                        .json({
                            message: "OK",
                        })
                })
            });
        }


    } else {
        res.status(400).json({
            message: 'err'
        })
    }
})






















const setCurs = asyncHandler(async (req, res) => {
    const { id, admem, curs, dne } = req.body


    const user = await User.findById(id);

    if (user) {
        if (user.notif == 'true') {
            crs = {}
            let D = new Date();
            const plusDney = Number(curs.split(',')[1]) / dne
            const god = D.getFullYear()
            const month = D.getMonth() + 1
            const day = D.getDate()

            const dat = moment(`${day}-${month}-${god}`, "DD-MM-YYYY").businessAdd(plusDney)._d;
            let Dst = new Date();
            crs.strt = Dst
            // D.setDate(D.getDate() + );
            crs.dlit = dat
            crs.name = curs.split(',')[0]

            User.findOneAndUpdate({ _id: id }, { curs: crs, not: 'false' }, { upsert: true }, function (err, doc) {

                if (err) return console.log(500, { error: err });
                let transporter = nodemailer.createTransport({
                    host: "smtp.yandex.ru",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_USER_PASSWORD,
                    },
                });

                // send mail with defined transport object
                let message = {
                    from: process.env.EMAIL_USER, // sender address
                    to: [admem, user.email], // list of receivers
                    subject: `Программа пользователя ${user.name} успешно изменена`, // Subject line
                    text: `Вы видите это письмо, потому что программа пользователя ${user.name} была изменена`, // plain text body
                };
                transporter.sendMail(message).then((info) => {
                    return res.status(201)
                        .json({
                            message: "OK",
                        })
                })

            });
        } else {
            crs = {}
            let D = new Date();
            let Dst = new Date();
            crs.strt = Dst
            D.setDate(D.getDate() + Number(curs.split(',')[1]));
            crs.dlit = D
            crs.name = curs.split(',')[0]

            User.findOneAndUpdate({ _id: id }, { curs: crs }, { upsert: true }, function (err, doc) {
                if (err) return console.log(500, { error: err });
                let transporter = nodemailer.createTransport({
                    host: "smtp.yandex.ru",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_USER_PASSWORD,
                    },
                });

                // send mail with defined transport object
                let message = {
                    from: process.env.EMAIL_USER, // sender address
                    to: admem, // list of receivers
                    subject: `Программа пользователя ${user.name} успешно изменена`, // Subject line
                    text: `Вы видите это письмо, потому что программа пользователя ${user.name} была изменена`, // plain text body
                };
                transporter.sendMail(message).then((info) => {
                    return res.status(201)
                        .json({
                            message: "OK",
                        })
                })
            });
        }


    } else {
        res.status(400).json({
            message: 'err'
        })
    }
})



const addTimes = asyncHandler(async (req, res) => {
    const { id, admem, numbD, dne } = req.body


    const user = await User.findById(id);

    if (user) {
        if (user.notif == 'true' && user.curs.dlit != undefined) {
            let D = new Date(user.curs.dlit);
            crs = {}
            const plusDney = Math.ceil(Number(numbD) / Number(dne)) + 1
            const god = D.getFullYear()
            const month = D.getMonth() + 1
            const day = D.getDate() - 1

            const dat = moment(`${day}-${month}-${god}`, "DD-MM-YYYY").businessAdd(plusDney)._d;
            crs.strt = user.curs.strt
            // D.setDate(D.getDate() + );
            crs.dlit = dat
            crs.name = user.curs.name

            User.findOneAndUpdate({ _id: id }, { curs: crs }, { upsert: true }, function (err, doc) {

                if (err) return console.log(500, { error: err });
                let transporter = nodemailer.createTransport({
                    host: "smtp.yandex.ru",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_USER_PASSWORD,
                    },
                });

                // send mail with defined transport object
                let message = {
                    from: process.env.EMAIL_USER, // sender address
                    to: [admem, user.email], // list of receivers
                    subject: `Программа пользователя ${user.name} успешно продлена`, // Subject line
                    text: `Вы видите это письмо, потому что программа пользователя ${user.name} была продлена`, // plain text body
                };
                transporter.sendMail(message).then((info) => {
                    return res.status(201)
                        .json({
                            message: "OK",
                        })
                })

            });
        } else if (user.curs.dlit != undefined && user.notif == 'false') {
            crs = {}
            let D = new Date(user.curs.dlit);
            const plusDney = Math.ceil(Number(numbD) / Number(dne)) + 1
            const god = D.getFullYear()
            const month = D.getMonth() + 1
            const day = D.getDate()

            const dat = moment(`${day}-${month}-${god}`, "DD-MM-YYYY").businessAdd(plusDney)._d;
            crs.strt = user.curs.strt
            // D.setDate(D.getDate() + );
            crs.dlit = dat
            crs.name = user.curs.name

            User.findOneAndUpdate({ _id: id }, { curs: crs }, { upsert: true }, function (err, doc) {
                if (err) return console.log(500, { error: err });
                let transporter = nodemailer.createTransport({
                    host: "smtp.yandex.ru",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_USER_PASSWORD,
                    },
                });

                // send mail with defined transport object
                let message = {
                    from: process.env.EMAIL_USER, // sender address
                    to: admem, // list of receivers
                    subject: `Программа пользователя ${user.name} успешно продлена`, // Subject line
                    text: `Вы видите это письмо, потому что программа пользователя ${user.name} была продлена`, // plain text body
                };
                transporter.sendMail(message).then((info) => {
                    return res.status(201)
                        .json({
                            message: "OK",
                        })
                })
            });
        }


    } else {
        res.status(400).json({
            message: 'err'
        })
    }
}
)







const deleteAkkPers = asyncHandler(async (req, res) => {
    const { id, admem } = req.body

    const doc = await User.findById(id)
    const us = doc.name
    try {
        doc.remove(async (info) => {
            let transporter = nodemailer.createTransport({
                host: "smtp.yandex.ru",
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_USER_PASSWORD,
                },
            });

            // send mail with defined transport object
            let message = {
                from: process.env.EMAIL_USER, // sender address
                to: admem, // list of receivers
                subject: `Вы успешно удалили аккаунт ${us}`, // Subject line
                text: `Учётная запись ${us} бала успешно удалена!`, // plain text body
            };
            transporter.sendMail(message).then((info) => {
                return res.status(201)
                    .json({
                        message: "Аккаунт удалён",
                    })
            })
        })
    } catch (e) {
        res.status(400).json({
            message: 'Не удалось удалить аккаунт'
        })
    }

})



const setNotif = asyncHandler(async (req, res) => {
    const { id, admem } = req.body


    const user = await User.findById(id);

    if (user) {
        if (user.notif == 'true') {
            User.findOneAndUpdate({ _id: id }, { notif: 'false' }, { upsert: true }, function (err, doc) {
                if (err) return console.log(500, { error: err });
                let transporter = nodemailer.createTransport({
                    host: "smtp.yandex.ru",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_USER_PASSWORD,
                    },
                });

                // send mail with defined transport object
                let message = {
                    from: process.env.EMAIL_USER, // sender address
                    to: admem, // list of receivers
                    subject: `Уведомления у пользователя ${user.name} отключены`, // Subject line
                    text: `Вы видите это письмо, потому уведомления у пользователя ${user.name} были отключены`, // plain text body
                };
                transporter.sendMail(message).then((info) => {
                    return res.status(201)
                        .json({
                            message: "OK",
                        })
                })
            });
        } else {
            User.findOneAndUpdate({ _id: id }, { notif: 'true' }, { upsert: true }, function (err, doc) {
                if (err) return console.log(500, { error: err });
                let transporter = nodemailer.createTransport({
                    host: "smtp.yandex.ru",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_USER_PASSWORD,
                    },
                });

                // send mail with defined transport object
                let message = {
                    from: process.env.EMAIL_USER, // sender address
                    to: admem, // list of receivers
                    subject: `Уведомления у пользователя ${user.name} включены`, // Subject line
                    text: `Вы видите это письмо, потому уведомления у пользователя ${user.name} были включены`, // plain text body
                };
                transporter.sendMail(message).then((info) => {
                    return res.status(201)
                        .json({
                            message: "OK",
                        })
                })
            });
        }


    } else {
        res.status(400).json({
            message: 'Срок смены почты истёк'
        })
    }
})




const renewAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {

        return res.status(405).json({ message: "User not authenticated" })
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH, async (err, user) => {

        if (!err) {
            const rest = await User.findById(user.id);
            if (rest !== null) {
                const { refresh } = await User.findById(user.id);
                if (refreshToken.split('.')[2] == refresh.split('.')[2]) {
                    const access = generateAccessToken(user.id);
                    return res.status(201).json({ access })
                }
                return res.status(405).json({ message: "Token invalid", err: err })

            } else if (rest === null) {
                return res.status(405).json({ message: "User not found" })
            }

        } else {
            return res.status(405).json({ message: "User not authenticated", err: err })
        }
    })
})






const restPass = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        res.status(400)
        throw new Error('Please add all fields')
    }

    const userr = await User.findOne({ email })


    if (!userr) {
        res.status(400)
        throw new Error('User with given does not exist')
    }

    const rand = generateAccessTokenResPass(email);
    const link = `https://client-vert-xi.vercel.app/resetPassEm/${userr._id}/${rand}`


    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.yandex.ru",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_USER_PASSWORD,
        },
    });

    // send mail with defined transport object
    let message = {
        from: process.env.EMAIL_USER, // sender address
        to: userr.email, // list of receivers
        subject: "Восстановление пароля", // Subject line
        text: `Перейдите по ссылке, чтобы восстановить пароль -> ${link}`, // plain text body
    };
    transporter.sendMail(message).then((info) => {
        return res.status(201)
            .json({
                message: "OK",
                rand: rand,
            })
    })

})


const restPassEm = asyncHandler(async (req, res) => {
    const { id, token, password } = req.body


    const user = await User.findById(id);


    if (user) {

        jwt.verify(token, process.env.JWT_SECRET_ACCESS_REST_PASS, async (err, user) => {
            if (!err) {
                const salt = await bcrypt.genSalt(10)
                const hashedPassword = await bcrypt.hash(password, salt)
                const refreshToken = generateRefreshToken(id);
                User.findOneAndUpdate({ _id: id }, { password: hashedPassword, refresh: refreshToken }, { upsert: true }, function (err, doc) {
                    if (err) return console.log(500, { error: err });
                    let transporter = nodemailer.createTransport({
                        host: "smtp.yandex.ru",
                        port: 465,
                        secure: true, // true for 465, false for other ports
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_USER_PASSWORD,
                        },
                    });

                    // send mail with defined transport object
                    let message = {
                        from: process.env.EMAIL_USER, // sender address
                        to: user.email, // list of receivers
                        subject: "Вы успешно восстановили пароль", // Subject line
                        text: `Вы видите это письмо, потому что пароль к учётной записи был изменён.`, // plain text body
                    };
                    transporter.sendMail(message).then((info) => {
                        return res.status(201)
                            .json({
                                message: "OK",
                            })
                    })
                });
            } else {
                res.status(400).json({
                    message: 'Срок смены пароля истёк. Повторите попытку'
                })
            }
        })

    } else {
        res.status(400)
        throw new Error('Invalid credentials')
    }
})


const deleteAkk = asyncHandler(async (req, res) => {
    const { id, email, password } = req.body

    const user = await User.findById(id);
    if (email === user.email) {
        bcrypt.compare(password, user.password).then((rest) => {
            if (rest) {
                const rand = generateAccessTokenResPass(user.email);
                const link = `https://client-vert-xi.vercel.app/deleteAkkEm/${id}/${rand}`


                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    host: "smtp.yandex.ru",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_USER_PASSWORD,
                    },
                });

                // send mail with defined transport object
                let message = {
                    from: process.env.EMAIL_USER, // sender address
                    to: user.email, // list of receivers
                    subject: "Удаление аккаунта", // Subject line
                    text: `Перейдите по ссылке, чтобы удалить аккаунт -> ${link} . Если это были не вы, то срочно поменяйте пароль своей учётной записи!`, // plain text body
                };
                transporter.sendMail(message).then((info) => {
                    return res.status(201)
                        .json({
                            message: "OK",
                        })
                })
            } else {
                return res.status(400).json({
                    message: 'Invalid credentials'
                })
            }
        })




    } else if (!bcrypt.compare(password, user.password) || email !== user.email) {
        return res.status(400).json({
            message: 'Invalid credentials'
        })
    }



})


const deleteAkkEm = asyncHandler(async (req, res) => {
    const { id, rand, email } = req.body


    const user = await User.findById(id);

    if (email === user.email) {
        jwt.verify(rand, process.env.JWT_SECRET_ACCESS_REST_PASS, async (err, user) => {

            if (!err) {
                const doc = await User.findById(id)
                try {
                    doc.remove(async (info) => {
                        let transporter = nodemailer.createTransport({
                            host: "smtp.yandex.ru",
                            port: 465,
                            secure: true, // true for 465, false for other ports
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_USER_PASSWORD,
                            },
                        });

                        // send mail with defined transport object
                        let message = {
                            from: process.env.EMAIL_USER, // sender address
                            to: email, // list of receivers
                            subject: "Вы успешно удалили аккаунт", // Subject line
                            text: `Ваша учётная запись бала успешно удалена!`, // plain text body
                        };
                        transporter.sendMail(message).then((info) => {
                            return res.status(201)
                                .json({
                                    message: "Аккаунт удалён",
                                })
                        })
                    })
                } catch {
                    res.status(400).json({
                        message: 'Не удалось удалить аккаунт'
                    })
                }

            } else {
                res.status(400).json({
                    message: "Срок удаления учётной записи истёк. Повторите попытку "
                })
            };

        })
    }
})


const cod = asyncHandler(async (req, res) => {

    const { id, cod } = req.body

    const user = await User.findById(id);

    if (String(cod) === user.code) {
        const { refresh } = await User.findById(id);

        jwt.verify(refresh, process.env.JWT_SECRET_REFRESH, (err, wf) => {

            if (!err) {
                return res.status(201)
                    .json({
                        message: "OK",
                        id: user._id,
                        role: user.role,
                        name: user.name,
                        Access_Token: generateAccessToken(user._id),
                        Refresh_Token: refresh,
                    })

            } else {
                const refresh = generateRefreshToken(user._id);
                User.findOneAndUpdate({ _id: user._id }, { refresh: refresh }, { upsert: true }, function (err, doc) {
                    if (err) return console.log(500, { error: err });
                    console.log('Succesfully saved.');
                });
                let transporter = nodemailer.createTransport({
                    host: "smtp.yandex.ru",
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_USER_PASSWORD,
                    },
                });

                // send mail with defined transport object
                let message = {
                    from: process.env.EMAIL_USER, // sender address
                    to: user.email, // list of receivers
                    subject: "Вход в аккаунт", // Subject line
                    text: `В ваш аккаунт вошли с нового устройства. Если это были не вы, то срочно поменяйте пароль!`, // plain text body
                };
                transporter.sendMail(message).then((info) => {
                    return res.status(201)
                        .json({
                            message: "OK",
                            id: user._id,
                            name: user.name,
                            role: user.role,
                            Access_Token: generateAccessToken(user._id),
                            Refresh_Token: refresh,
                        })
                })
            }
        })





    }
})





const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_ACCESS, {
        expiresIn: '10m',
    })
}

const generateAccessTokenResPass = (email) => {
    return jwt.sign({ email }, process.env.JWT_SECRET_ACCESS_REST_PASS, {
        expiresIn: '10m',
    })
}


const generateRefreshToken = (id) => {
    const refresh = jwt.sign({ id }, process.env.JWT_SECRET_REFRESH, {
        expiresIn: '30d',
    })

    return refresh;

}




module.exports = {
    registerUser,
    loginUser,
    getMe,
    renewAccessToken,
    restPass,
    restPassEm,
    deleteAkk,
    deleteAkkEm,
    cod,
    allUsAdm,
    prTime,
    setNotif,
    setCurs,
    vupok,
    userCurs,
    compsSotr,
    addTimes,
    deleteAkkPers
}