const jwt = require('jsonwebtoken');
const redis = require('redis');

// setup Redis:
const redisClient = redis.createClient(process.env.REDIS_URI);

const handleSignin = (req, res, db, bcrypt) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return Promise.reject('incorrect form submission');
    }
    return db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if(isValid) {
            return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => user[0])
            .catch(err => res.status(400).json('unable to get user'))
        } else {
           return Promise.reject('wrong credentials');
        }
    })
    .catch(err => err);
}

const getAuthTokenId = (req, res) => {
    const { authorization } = req.headers;
    return redisClient.get(authorization, (err, reply) => {
        if(err || !reply) {
            return res.status(400).json('Unauthorized');
        }
        return res.json({id: reply});
    })
}

const signToken = (email) => {
    const jwtPayload = { email };
    return jwt.sign(jwtPayload, 'JWT_SECRET', { expiresIn: '2 days' });
}

const setToken = (key, value) => {
    return Promise.resolve(redisClient.set(key, value));
}

const createSessions = (user) => {
    // JWT token, return user data
    const { email, id } = user;
    const token = signToken(email);
    return setToken(token, id)
    .then(() => {
        return { success: 'true', userId: id, token };
    })
    .catch(console.log);
}


const signinAuthentication = (db, bcrypt) => (req, res) => {
    const { authorization } = req.headers;
    return authorization ? getAuthTokenId(req, res) : 
    handleSignin(req, res, db, bcrypt)
        .then(data => {
            return data.id && data.email ? createSessions(data) : Promise.reject(data)
        })
        .then(session => res.json(session))
        .catch(err => res.status(400).json(err));
}

module.exports = {
    signinAuthentication,
    redisClient
}