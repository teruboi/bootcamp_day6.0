const express = require('express')
const expressLayout = require('express-ejs-layouts')
const fs = require('fs')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const validator = require('validator')
const { checkDuplicate } = require('./function')

// call database
const pool = require('./db')
const { body, check, validationResult } = require('express-validator')


const app = express()
app.use(express.json()) // => req.body
const port = 3000

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//Using EJS as the view engine
app.set('view engine', 'ejs')

app.use(morgan('status'))

//EJS Layouts using Express-EJS-Layouts
app.use(expressLayout)
app.set('layout', './layout/full-width')

app.use((req, res, next) => {
    console.log('Time:', Date.now())
    next()
})

app.use(express.static('public'))

app.get('/', (req, res) => {
//   res.sendFile('./index.html', {root: __dirname})
    res.render('index', {title: 'Homepage'})
})

app.get('/about', (req, res, next) => {
    // res.sendFile('./about.html', {root: __dirname})
    res.render('about', {title: 'About'})
})

app.get('/contact', async (req, res) => {
    try {
        const db = (await pool.query('SELECT name, phone FROM contacts')).rows
        // console.log(db)
        res.render('contact', {title: 'Contacts', arr: db, msg: req.query.success})
    } catch (err) {
        console.error(err.message);
    }
    
})

app.get('/contact/detail/:name', async (req, res) => {
    try {
        const db = (await pool.query(`SELECT * FROM contacts WHERE name = '${req.params.name}'`)).rows
        // console.log(db)
        res.render('detail', {title: `${req.params.name}'s Contact Detail`, name: req.params.name, arr: db})
    } catch (err) {
        console.error(err.message);
    }
    
})

app.get('/contact/create', (req, res) => {
    res.render('create', {title: 'Create New Contact', name: "", email: "", phone: "", msg: req.query.err})
})

app.post('/contact/create', [
body('newName').custom(async (value) => {
    const dupData = await checkDuplicate(value)
    if(dupData) {
        throw new Error('Contact already exists')
    }
    return true
}),
check('newEmail', 'Invalid email').isEmail(),
check('newPhone', 'Invalid phone number').isMobilePhone('id-ID'),
],
async (req, res) => {
    const errors = validationResult(req)
    console.log(errors.array());

    if (!errors.isEmpty()) {
        res.render('create', {title: 'Create New Contact', name: req.body.newName, email: req.body.newEmail, phone: req.body.newPhone, err: errors.array()})
    } else {
        try {
            const name = req.body.newName
            const email = req.body.newEmail
            const phone = req.body.newPhone
    
            await pool.query(`INSERT INTO contacts VALUES ('${name}', '${email}', '${phone}')`)
            res.redirect('/contact?success=create')
        } catch (err) {
            console.error(err.message);
        }
    }
})

app.get('/contact/edit/:name', async (req,res) => {
    try {
        const name = req.params.name
        const db = (await pool.query(`SELECT * FROM contacts WHERE name = '${req.params.name}'`)).rows
        console.log(db)

        res.render('edit', {title: 'Edit Contact Detail', arr: db, oldName: name, msg: req.query.err})
    } catch (err) {
        console.error(err.message);
    }
})

app.post('/contact/edit/:oldname', [
body('newName').custom(async (value, { req }) => {
    const dupData = await checkDuplicate(value)
    if(value !== req.params.oldname && dupData) {
        throw new Error('Contact already exists')
    }
    return true
}),
check('newEmail', 'Invalid email').isEmail(),
check('newPhone', 'Invalid phone number').isMobilePhone('id-ID'),
], async (req,res) => {
    const errors = validationResult(req)
    console.log(errors.array());

    if (!errors.isEmpty()) {
        res.render('edit', {title: 'Edit Contact Detail', oldName: req.params.oldname, arr: [{name: req.body.newName, email: req.body.newEmail, phone: req.body.newPhone}], err: errors.array()})
    } else {
        try {
            const name = req.body.newName
            const email = req.body.newEmail
            const phone = req.body.newPhone
    
            await pool.query(`UPDATE contacts SET name='${name}', email='${email}', phone='${phone}' WHERE name = '${req.params.oldname}'`)
            res.redirect('/contact?success=edit')
        } catch (err) {
            console.error(err.message);
        }
    }
})

app.get('/contact/delete/:name', async (req,res) => {
    try {
        await pool.query(`DELETE FROM contacts WHERE name = '${req.params.name}'`)
        res.redirect('/contact?success=delete')
    } catch (err) {
        console.error(err.message);
    }
})

app.get('/product/:id', (req, res) => {
    const id = req.params.id
    res.send(`This ${req.query.category} have a product id ${id}`)
})

app.use('/', (req, res) => {
    res.status(404)
    res.send('Page Not Found: 404')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})