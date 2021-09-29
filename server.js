const express = require('express');
//const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');

const app = express();
//app.use(bodyParser.json()); express 4.16 버전부터는 bodyparser가 express에 포함됨
app.use(express.json());
app.use(cors());


const knex = require('knex')

const db = knex({ //connect db
    client : 'pg',
    connection : {
        host : '127.0.0.1', //local host
        user : 'postgres',
        password :'thpine',
        database : 'smartbrain'
    }
});

const database = {
    users : [
        {
            id:'123',
            name : 'John',
            email : 'john@gmail.com',
            entries : 0,
            password:'cookies',
            joined : new Date()
        },
        {
            id:'124',
            name : 'Sally',
            email : 'sally@gmail.com',
            entries : 0,
            password : 'bananas',
            joined : new Date()
        }
    ] ,
    login :[
        {
            id : '987',
            has :'',
            email :'john@gmail.com'
        }
    ]
}

app.get('/' , (req,res)=>{
    //res.send(database.users);
})

app.post('/signin' , (req,res)=>{
    db.select('email','hash').from('login')
    .where('email','=',req.body.email)
    .then(data => {
       const isValid =bcrypt.compareSync(req.body.password , data[0].hash);
       if(isValid){
           return db.select('*').from('users')
           .where('email','=',req.body.email)
           .then(user =>{
               console.log(user)
                res.json(user[0])
           })
           .catch(err=>res.status(400).json('unable to get user'))
       }else{
        res.status(400).json('wrong credentials');
       }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register' , (req,res)=>{
   const {email , name, password} = req.body;
   const hash = bcrypt.hashSync(password);
    db.transaction(trx => { //have to two things at once
        trx.insert({
            hash : hash,
            email : email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
        
        return trx('users')
            .returning('*')
            .insert({
            email : loginEmail[0],
            name : name,
            joined : new Date()
            })
            .then(user =>{
            res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'));
})

app.get('/profile/:id',(req,res)=>{
    const {id} = req.params;
    db.select('*').from('users').where({
        id : id
    }).then(user => {
        if(user.length){
            res.json(user[0]);
        }
        else{
            res.status(400).json('not found');
        }
    })
    .catch(err => res.status(400).json('error getting user'))
    
})

app.put('/image',(req,res)=>{
    const {id} = req.body;
    db('users').where('id','=',id)
    .increment('entries',1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0]);
    })
    .catch(err => res.status(400).json('unable to get entries'));
})

app.listen(3000 , ()=>{
    console.log('app is running on port');
})

/*
/signin --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT --> user
*/