require('dotenv').config()
const express = require('express')
const app = express()
http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors()) // Add cors middleware

const server = http.createServer(app) // Add this

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/send_to_customer', (req, res) => {
    const { customer_id } = req.body
    var receiver = allUserSockets.find(user => user.user_id == customer_id && user.type === 'customer')
    if (receiver) {
        io.to(receiver.socketId).emit('CUSTOMER_MSG_RECEIVED')
    }
    return res.json(true)
})

app.post('/send_to_user', (req, res) => {
    const { user_id } = req.body
    var receiver = allUserSockets.find(user => user.user_id == user_id && user.type === 'user')
    if (receiver) {
        io.to(receiver.socketId).emit('USER_MSG_RECEIVED')
    }
    return res.json(true)
})

app.post('/send_notification', (req, res) => {
    const { id } = req.body
    var receiver = allUserSockets.find(user => user.user_id == id)
    if (receiver) {
        io.to(receiver.socketId).emit('notification', req.body.message)
    }
    return res.json(true)
})

var allUserSockets = []; // All users in current chat room

// Listen for when the client connects via socket.io-client
io.on('connection', (socket) => {
    console.log(`User connected ${socket.id}`)
    socket.emit('USERID_REQUEST', {})
    socket.on('USERID_RESPONSE', async (data) => {
        console.log(data)
        if (data && data.user_id) {
            var user = {
                socketId: socket.id,
                user_id: data.user_id,
                type: data.type
            }

            var findUser = allUserSockets.some(x => x.user_id == data.user_id && x.socketId == socket.id)
            if (!findUser) {
                allUserSockets.push(user)
            }
        }
    })

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        allUserSockets = allUserSockets.filter(user => user.socketId != socket.id)
    })
})

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => { console.log(`Server is running on port ${PORT}`) });
