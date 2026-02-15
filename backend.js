const express = require('express')
const app = express()
const port = 3000

//socket.io setup
const http = require('http')
const server = http.createServer(app) // creating a server based on http nut wrapping it aorund express server
const { Server } = require('socket.io');
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000})
// a server around server around server, ask chatgpt for more clari

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {}

io.on('connection', (socket) => {
  console.log('a user connected')
  //creating a new player object witha property of whatever the socket id
  backEndPlayers[socket.id] = {
    x: 100 * Math.random(),
    y: 100 * Math.random(),
    color: `hsl(${360 * Math.random()}, 100%, 50%)`
  }
  //broadcast everyone new player has joined
  io.emit('updatePlayers', backEndPlayers)

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  console.log(backEndPlayers)

});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log('server loaded')
