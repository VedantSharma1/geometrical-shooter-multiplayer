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

const players = {}

io.on('connection', (socket) => {
  console.log('a user connected')
  //creating a new player object witha property of whatever the socket id
  players[socket.id] = {
    x: 100 * Math.random(),
    y: 100 * Math.random()
  }
  //broadcast everyone new player has joined
  io.emit('updatePlayers', players)

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete players[socket.id]
    io.emit('updatePlayers', players)
  })

  console.log(players)

});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log('server loaded')
